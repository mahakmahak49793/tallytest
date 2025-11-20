/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/companies/route.ts
import { NextResponse } from 'next/server';

const TALLY_URL = 'http://localhost:9000';

interface Company {
  guid: string;
  name: string;
  companyNumber: string;
  startingFrom: string;
  booksFrom: string;
  address: string;
  email: string;
  phone: string;
  website:string,
  currentPeriod: string;
  currentDate: string;
  isActive: boolean;
}

export async function GET() {
  try {
    // Step 1: Fetch all companies
    const companies = await fetchAllCompanies();
    
    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Step 2: Fetch company info for the active company
    const companiesWithDetails = await fetchCompaniesWithDetails(companies);

    return NextResponse.json({
      success: true,
      count: companiesWithDetails.length,
      data: companiesWithDetails,
    });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch companies from Tally',
        hint: 'Make sure Tally is running with ODBC Server enabled (Port 9000)',
      },
      { status: 500 }
    );
  }
}

async function fetchAllCompanies(): Promise<Company[]> {
const xmlRequest = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>AllCompanies</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllCompanies" ISMODIFY="No" ISFIXED="No">
            <TYPE>Company</TYPE>
            <NATIVEMETHOD>*</NATIVEMETHOD>
            <FETCH>GUID, Name, CompanyNumber, StartingFrom, BooksFrom, Address, EMail, PhoneNumber, WebAddress</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

  const response = await fetch(TALLY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      'Content-Length': xmlRequest.length.toString(),
    },
    body: xmlRequest,
  });

  if (!response.ok) {
    throw new Error(`Tally server responded with status ${response.status}`);
  }

  const xmlData = await response.text();
  return parseCompaniesXML(xmlData);
}

async function fetchCompaniesWithDetails(companies: Company[]): Promise<Company[]> {
  const companiesWithDetails: Company[] = [];
  
  for (const company of companies) {
    try {
      // Fetch company info for each company
      const companyInfo = await fetchCompanyInfo(company.name);
      
      companiesWithDetails.push({
        ...company,
        currentPeriod: companyInfo.currentPeriod,
        currentDate: companyInfo.currentDate,
        isActive: companyInfo.isActive,
      });
    } catch (error) {
      console.error(`Error fetching details for company ${company.name}:`, error);
      // If we can't get details, keep the company without current period/date
      companiesWithDetails.push({
        ...company,
        currentPeriod: '',
        currentDate: '',
        isActive: false,
      });
    }
  }
  
  return companiesWithDetails;
}

async function fetchCompanyInfo(companyName: string): Promise<{ currentPeriod: string; currentDate: string; isActive: boolean }> {
  // XML request to get company info with current period and date
  const xmlRequest = `<ENVELOPE>
    <HEADER>
      <TALLYREQUEST>Import</TALLYREQUEST>
      <TYPE>Data</TYPE>
      <ID>Company Info</ID>
    </HEADER>
    <BODY>
      <DESC>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
        <TDL>
          <TDLMESSAGE>
            <REPORT NAME="Company Info" ISMODIFY="No">
              <CURRENTPERIOD>*</CURRENTPERIOD>
              <CURRENTDATE>*</CURRENTDATE>
            </REPORT>
          </TDLMESSAGE>
        </TDL>
      </DESC>
    </BODY>
  </ENVELOPE>`;

  const response = await fetch(TALLY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      'Content-Length': xmlRequest.length.toString(),
    },
    body: xmlRequest,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch company info for ${companyName}`);
  }

  const xmlData = await response.text();
  return parseCompanyInfoXML(xmlData);
}

function parseCompaniesXML(xml: string): Company[] {
  const companies: Company[] = [];
  
  // Match all COMPANY tags (case-insensitive)
  const companyRegex = /<COMPANY[^>]*>([\s\S]*?)<\/COMPANY>/gi;
  const matches = xml.matchAll(companyRegex);
  
  for (const match of matches) {
    const companyXml = match[1];
    
    // Extract values from tags
    const company: Company = {
      guid: extractTagValue(companyXml, 'GUID'),
      name: extractTagValue(companyXml, 'NAME'),
      companyNumber: extractTagValue(companyXml, 'COMPANYNUMBER'),
      startingFrom: extractTagValue(companyXml, 'STARTINGFROM'),
      booksFrom: extractTagValue(companyXml, 'BOOKSFROM'),
      address: extractTagValue(companyXml, 'ADDRESS'),
      email: extractTagValue(companyXml, 'EMAIL'),
      phone: extractTagValue(companyXml, 'PHONENUMBER'),
       website: extractTagValue(companyXml, 'WEBADDRESS'),
      currentPeriod: '',
      currentDate: '',
      isActive: false,
    };
    
    // Only add if company has at least a name
    if (company.name) {
      companies.push(company);
    }
  }
  
  if (companies.length === 0) {
    const nameRegex = /<DSPACCNAME[^>]*>([^<]+)<\/DSPACCNAME>/gi;
    const nameMatches = xml.matchAll(nameRegex);
    
    for (const match of nameMatches) {
      const name = match[1].trim();
      if (name && name !== 'All Companies') {
        companies.push({
          name: name,
          guid: '',
          companyNumber: '',
          startingFrom: '',
          booksFrom: '',
          address: '',
          email: '',
          website:'',
          phone: '',
          currentPeriod: '',
          currentDate: '',
          isActive: false,
        });
      }
    }
  }
  
  return companies;
}

function parseCompanyInfoXML(xml: string): { currentPeriod: string; currentDate: string; isActive: boolean } {
  // Extract current period and date from company info XML
  const currentPeriod = extractTagValue(xml, 'CURRENTPERIOD') || extractTagValue(xml, 'CURRENTPERIOD$.DATE');
  const currentDate = extractTagValue(xml, 'CURRENTDATE') || extractTagValue(xml, 'CURRENTDATE$.DATE');
  
  // If we successfully got current period/date, consider the company active
  const isActive = !!(currentPeriod || currentDate);
  
  return {
    currentPeriod: currentPeriod || '',
    currentDate: currentDate || '',
    isActive,
  };
}

function extractTagValue(xml: string, tagName: string): string {
  // Try standard tag format
  let regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
  let match = xml.match(regex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Try with namespace prefix
  regex = new RegExp(`<[a-z]*:${tagName}[^>]*>([^<]*)<\/[a-z]*:${tagName}>`, 'i');
  match = xml.match(regex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Try with $ suffix (common in Tally for formatted values)
  regex = new RegExp(`<${tagName}\\$[^>]*>([^<]*)<\/${tagName}\\$[^>]*>`, 'i');
  match = xml.match(regex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return '';
}