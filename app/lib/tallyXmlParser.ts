// lib/tallyXmlParser.ts
import { XMLParser } from 'fast-xml-parser';

export interface TallyMasterData {
  name: string;
  alias?: string;
  guid: string;
  parent?: string;
  [key: string]: any;
}

export function parseTallyXML(xmlData: string, masterType: string): TallyMasterData[] {
  console.log('=== Starting XML Parse ===');
  console.log('Master Type:', masterType);
  console.log('XML Length:', xmlData.length);
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    trimValues: true,
    parseTrueNumberOnly: false,
  });

  try {
    const jsonObj = parser.parse(xmlData);
    console.log('Parsed JSON Structure:', JSON.stringify(jsonObj, null, 2).substring(0, 1000));
    
    // Try multiple parsing strategies
    let results = parseStrategy1(jsonObj, masterType);
    if (results.length === 0) {
      console.log('Strategy 1 failed, trying Strategy 2');
      results = parseStrategy2(jsonObj, masterType);
    }
    if (results.length === 0) {
      console.log('Strategy 2 failed, trying Strategy 3');
      results = parseStrategy3(jsonObj, masterType);
    }
    
    console.log('Final Results Count:', results.length);
    return results;
  } catch (error) {
    console.error('XML Parsing Error:', error);
    return [];
  }
}

// Strategy 1: Standard TALLYMESSAGE format
function parseStrategy1(jsonObj: any, masterType: string): TallyMasterData[] {
  const results: TallyMasterData[] = [];
  const envelope = jsonObj?.ENVELOPE;
  
  if (!envelope?.BODY) return [];
  
  const body = envelope.BODY;
  const data = body.IMPORTDATA || body.DATA || body.EXPORTDATA;
  
  if (!data) return [];
  
  const tallymessage = data.TALLYMESSAGE;
  if (!tallymessage) return [];
  
  const msgArray = Array.isArray(tallymessage) ? tallymessage : [tallymessage];
  
  const masterTypeMap: { [key: string]: string } = {
    units: 'UNIT',
    currencies: 'CURRENCY',
    ledgers: 'LEDGER',
    costcenters: 'COSTCENTRE',
    stockgroups: 'STOCKGROUP',
    stockitems: 'STOCKITEM',
    godowns: 'GODOWN',
  };
  
  const xmlTag = masterTypeMap[masterType];
  
  for (const msg of msgArray) {
    const item = msg[xmlTag];
    if (item) {
      results.push(extractFields(item));
    }
  }
  
  return results;
}

// Strategy 2: Direct collection format
function parseStrategy2(jsonObj: any, masterType: string): TallyMasterData[] {
  const results: TallyMasterData[] = [];
  const envelope = jsonObj?.ENVELOPE;
  
  if (!envelope?.BODY) return [];
  
  const body = envelope.BODY;
  
  // Look for collection data
  const searchPaths = [
    body.DATA?.COLLECTION,
    body.IMPORTDATA?.REQUESTDATA,
    body.EXPORTDATA?.REQUESTDATA,
    body.COLLECTION,
  ];
  
  for (const path of searchPaths) {
    if (path) {
      const items = Array.isArray(path) ? path : [path];
      for (const item of items) {
        if (item && typeof item === 'object') {
          results.push(extractFields(item));
        }
      }
    }
  }
  
  return results;
}

// Strategy 3: Search entire tree for master objects
function parseStrategy3(jsonObj: any, masterType: string): TallyMasterData[] {
  const results: TallyMasterData[] = [];
  
  const masterTags = ['UNIT', 'CURRENCY', 'LEDGER', 'COSTCENTRE', 
                      'STOCKGROUP', 'STOCKITEM', 'GODOWN'];
  
  function searchTree(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    
    for (const key in obj) {
      if (masterTags.includes(key)) {
        const items = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
        for (const item of items) {
          if (item && typeof item === 'object') {
            results.push(extractFields(item));
          }
        }
      } else if (typeof obj[key] === 'object') {
        searchTree(obj[key]);
      }
    }
  }
  
  searchTree(jsonObj);
  return results;
}

function extractFields(item: any): TallyMasterData {
  // Extract common fields from Tally master data
  const result: TallyMasterData = {
    name: item.NAME || item['@_NAME'] || item.name || '',
    guid: item.GUID || item['@_GUID'] || item.guid || '',
    alias: item.ALIAS || item.alias || undefined,
    parent: item.PARENT || item.parent || undefined,
  };
  
  // Add additional fields based on what's available
  const additionalFields = [
    'OPENINGBALANCE', 'CLOSINGBALANCE', 'CATEGORY', 'BASEUNITS',
    'DECIMALPLACES', 'CURRENCYSYMBOL', 'ISREVENUE', 'ISDEEMEDPOSITIVE',
    'COSTCENTRENAME', 'MAILINGNAME', 'ADDRESS', 'COUNTRY', 'STATE',
  ];
  
  for (const field of additionalFields) {
    if (item[field] !== undefined) {
      result[field.toLowerCase()] = item[field];
    }
  }
  
  return result;
}

// Utility function to help debug XML structure
export function analyzeXMLStructure(xmlData: string): any {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });
  
  try {
    const jsonObj = parser.parse(xmlData);
    
    function getStructure(obj: any, depth = 0): any {
      if (depth > 5) return '...';
      
      if (Array.isArray(obj)) {
        return `Array[${obj.length}]`;
      }
      
      if (obj && typeof obj === 'object') {
        const structure: any = {};
        for (const key in obj) {
          structure[key] = getStructure(obj[key], depth + 1);
        }
        return structure;
      }
      
      return typeof obj;
    }
    
    return getStructure(jsonObj);
  } catch (error) {
    return { error: 'Failed to parse XML' };
  }
}