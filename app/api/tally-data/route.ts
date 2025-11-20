/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/tally-data/route.ts
import { NextResponse } from 'next/server';

// Hardcoded XML data from Tally
const TALLY_XML_DATA = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <COMPANY>
            <NAME>Eco Innovative Technical Services LLC</NAME>
            <GUID>74f8907f-b912-4678-b507-63b5e7f3b1ab-0000001d</GUID>
            <CURRENCYNAME>UAE Dirham</CURRENCYNAME>
            <MAILINGNAME>MD</MAILINGNAME>
            <CURRENCYSYMBOL>AED</CURRENCYSYMBOL>
            <DISPLAYNAME>UAE Dirham</DISPLAYNAME>
            <SUBUNIT>fils</SUBUNIT>
            <FEATURE1>No</FEATURE1>
            <FEATURE2>No</FEATURE2>
            <FEATURE3>No</FEATURE3>
            <FEATURE4>No</FEATURE4>
            <FEATURE5>No</FEATURE5>
            <FEATURE6>Yes</FEATURE6>
            <FEATURE7>Yes</FEATURE7>
            <CODE>682222</CODE>
          </COMPANY>
        </TALLYMESSAGE>
        
        <TALLYMESSAGE>
          <CURRENCY>
            <GUID>74f8907f-b912-4678-b507-63b5e7f3b1ab-0000001d</GUID>
            <NAME>UAE Dirham</NAME>
            <MAILINGNAME>MD</MAILINGNAME>
            <SYMBOL>AED</SYMBOL>
            <DISPLAYNAME>UAE Dirham</DISPLAYNAME>
            <SUBUNIT>fils</SUBUNIT>
            <FEATURE1>No</FEATURE1>
            <FEATURE2>No</FEATURE2>
            <FEATURE3>No</FEATURE3>
            <FEATURE4>No</FEATURE4>
            <FEATURE5>No</FEATURE5>
            <FEATURE6>Yes</FEATURE6>
            <FEATURE7>Yes</FEATURE7>
            <CODE>682222</CODE>
          </CURRENCY>
        </TALLYMESSAGE>
        
        <TALLYMESSAGE>
          <LEDGERGROUP>
            <GUID>74f8907f-b912-4678-b507-63b5e7f3b1ab-00000003</GUID>
            <FEATURE1>No</FEATURE1>
            <FEATURE2>No</FEATURE2>
            <FEATURE3>No</FEATURE3>
            <FEATURE4>No</FEATURE4>
            <FEATURE5>No</FEATURE5>
            <FEATURE6>No</FEATURE6>
            <FEATURE7>No</FEATURE7>
            <FEATURE8>No</FEATURE8>
            <FEATURE9>No</FEATURE9>
            <FEATURE10>No</FEATURE10>
            <FEATURE11>No</FEATURE11>
            <FEATURE12>No</FEATURE12>
            <FEATURE13>No</FEATURE13>
            <FEATURE14>No</FEATURE14>
            <FEATURE15>No</FEATURE15>
            <FEATURE16>No</FEATURE16>
            <FEATURE17>No</FEATURE17>
            <FEATURE18>No</FEATURE18>
            <CODE>306447</CODE>
          </LEDGERGROUP>
        </TALLYMESSAGE>
        
        <TALLYMESSAGE>
          <LEDGERGROUP>
            <NAME>Current Liabilities</NAME>
            <CODE1>10337</CODE1>
            <GUID>74f8907f-b912-4678-b507-63b5e7f3b1ab-0000000e</GUID>
            <PARENT>Current Liabilities</PARENT>
            <FEATURE1>No</FEATURE1>
            <FEATURE2>No</FEATURE2>
            <FEATURE3>No</FEATURE3>
            <FEATURE4>No</FEATURE4>
            <FEATURE5>No</FEATURE5>
            <FEATURE6>No</FEATURE6>
            <FEATURE7>No</FEATURE7>
            <FEATURE8>No</FEATURE8>
            <FEATURE9>No</FEATURE9>
            <FEATURE10>No</FEATURE10>
            <FEATURE11>No</FEATURE11>
            <FEATURE12>No</FEATURE12>
            <FEATURE13>No</FEATURE13>
            <FEATURE14>No</FEATURE14>
            <FEATURE15>No</FEATURE15>
            <FEATURE16>No</FEATURE16>
            <FEATURE17>No</FEATURE17>
            <FEATURE18>No</FEATURE18>
            <CODE2>140645</CODE2>
            <NUMBER>1</NUMBER>
          </LEDGERGROUP>
        </TALLYMESSAGE>
        
        <TALLYMESSAGE>
          <LEDGER>
            <NAME>Duties &amp; Taxes</NAME>
            <CODE>1033-1</CODE>
            <GUID>74f8907f-b912-4678-b507-63b5e7f3b1ab-000000a9</GUID>
            <CURRENCY>AED</CURRENCY>
            <PARENT>Duties &amp; Taxes</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

// XML Parser utility
function parseXMLToJSON(xmlString: string) {
  const extractTag = (xml: string, tagName: string) => {
    const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractAllMessages = (xml: string) => {
    const regex = /<TALLYMESSAGE>([\s\S]*?)<\/TALLYMESSAGE>/g;
    const matches = [...xml.matchAll(regex)];
    return matches.map(match => match[1].trim());
  };

  const messages = extractAllMessages(xmlString);
  
  let company = null;
  let currency = null;
  const ledgerGroups: any[] = [];
  const ledgers: any[] = [];

  messages.forEach(message => {
    if (message.includes('<COMPANY>')) {
      const companyXML = extractTag(message, 'COMPANY');
      company = {
        name: extractTag(companyXML, 'NAME'),
        guid: extractTag(companyXML, 'GUID'),
        mailingName: extractTag(companyXML, 'MAILINGNAME'),
        code: extractTag(companyXML, 'CODE'),
        currency: {
          name: extractTag(companyXML, 'CURRENCYNAME'),
          symbol: extractTag(companyXML, 'CURRENCYSYMBOL'),
          subunit: extractTag(companyXML, 'SUBUNIT'),
        }
      };
    } else if (message.includes('<CURRENCY>')) {
      const currencyXML = extractTag(message, 'CURRENCY');
      currency = {
        guid: extractTag(currencyXML, 'GUID'),
        name: extractTag(currencyXML, 'NAME'),
        mailingName: extractTag(currencyXML, 'MAILINGNAME'),
        symbol: extractTag(currencyXML, 'SYMBOL'),
        displayName: extractTag(currencyXML, 'DISPLAYNAME'),
        subunit: extractTag(currencyXML, 'SUBUNIT'),
        code: extractTag(currencyXML, 'CODE'),
      };
    } else if (message.includes('<LEDGERGROUP>')) {
      const groupXML = extractTag(message, 'LEDGERGROUP');
      ledgerGroups.push({
        name: extractTag(groupXML, 'NAME') || null,
        guid: extractTag(groupXML, 'GUID'),
        code: extractTag(groupXML, 'CODE') || extractTag(groupXML, 'CODE1'),
        code2: extractTag(groupXML, 'CODE2') || null,
        parent: extractTag(groupXML, 'PARENT') || null,
        number: extractTag(groupXML, 'NUMBER') || null,
      });
    } else if (message.includes('<LEDGER>')) {
      const ledgerXML = extractTag(message, 'LEDGER');
      ledgers.push({
        name: extractTag(ledgerXML, 'NAME'),
        guid: extractTag(ledgerXML, 'GUID'),
        code: extractTag(ledgerXML, 'CODE'),
        currency: extractTag(ledgerXML, 'CURRENCY'),
        parent: extractTag(ledgerXML, 'PARENT'),
      });
    }
  });

  return {
    company,
    currency,
    ledgerGroups,
    ledgers
  };
}

export async function GET() {
  try {
    const jsonData = parseXMLToJSON(TALLY_XML_DATA);
    
    return NextResponse.json({
      success: true,
      message: 'Tally data retrieved successfully',
      data: jsonData
    });
  } catch (error) {
    console.error('Error parsing XML:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to parse XML data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint - Accepts custom XML and returns JSON
export async function POST(request: Request) {
  try {
    const xmlData = await request.text();
    
    if (!xmlData || xmlData.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No XML data provided' },
        { status: 400 }
      );
    }

    const jsonData = parseXMLToJSON(xmlData);
    
    return NextResponse.json({
      success: true,
      message: 'XML data converted to JSON successfully',
      data: jsonData
    });
  } catch (error) {
    console.error('XML parsing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to parse XML data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}