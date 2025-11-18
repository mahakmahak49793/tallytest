// app/api/tally/current-company/route.ts
import { NextRequest, NextResponse } from 'next/server';

const TALLY_URL = 'http://localhost:9000';

interface CurrentCompany {
  name: string;
  guid: string;
  companyNumber: string;
  address: string;
  email: string;
  phone: string;
  booksFrom: string;
  startingFrom: string;
  pinCode: string;
  state: string;
  country: string;
}

export async function GET(request: NextRequest) {
  try {
    // XML request to fetch currently open company details
    const xmlRequest = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>CurrentCompanyData</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>##SVCURRENTCOMPANY</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <REPORT NAME="CurrentCompanyReport">
            <FORMS>CurrentCompanyForm</FORMS>
          </REPORT>
          
          <FORM NAME="CurrentCompanyForm">
            <PARTS>CurrentCompanyPart</PARTS>
          </FORM>
          
          <PART NAME="CurrentCompanyPart">
            <LINES>CurrentCompanyLine</LINES>
            <REPEAT>CurrentCompanyLine : CompanyCollection</REPEAT>
            <SCROLLED>Vertical</SCROLLED>
          </PART>
          
          <LINE NAME="CurrentCompanyLine">
            <FIELDS>FldName, FldGUID, FldNumber, FldAddress, FldEmail, FldPhone, FldBooksFrom, FldStartingFrom, FldPinCode, FldState, FldCountry</FIELDS>
          </LINE>
          
          <FIELD NAME="FldName">
            <SET>$Name</SET>
          </FIELD>
          
          <FIELD NAME="FldGUID">
            <SET>$GUID</SET>
          </FIELD>
          
          <FIELD NAME="FldNumber">
            <SET>$CompanyNumber</SET>
          </FIELD>
          
          <FIELD NAME="FldAddress">
            <SET>$Address</SET>
          </FIELD>
          
          <FIELD NAME="FldEmail">
            <SET>$Email</SET>
          </FIELD>
          
          <FIELD NAME="FldPhone">
            <SET>$PhoneNumber</SET>
          </FIELD>
          
          <FIELD NAME="FldBooksFrom">
            <SET>$BooksFrom</SET>
          </FIELD>
          
          <FIELD NAME="FldStartingFrom">
            <SET>$StartingFrom</SET>
          </FIELD>
          
          <FIELD NAME="FldPinCode">
            <SET>$PinCode</SET>
          </FIELD>
          
          <FIELD NAME="FldState">
            <SET>$State</SET>
          </FIELD>
          
          <FIELD NAME="FldCountry">
            <SET>$Country</SET>
          </FIELD>
          
          <COLLECTION NAME="CompanyCollection">
            <TYPE>Company</TYPE>
            <FILTER>IsCurrentCompany</FILTER>
          </COLLECTION>
          
          <SYSTEM TYPE="Formulae" NAME="IsCurrentCompany">
            $$IsSysNameEqual:$Name:##SVCURRENTCOMPANY
          </SYSTEM>
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
    
    // Parse XML response to extract current company
    const currentCompany = parseCurrentCompanyXML(xmlData);

    return NextResponse.json({
      success: true,
      data: currentCompany,
    });
  } catch (error: any) {
    console.error('Error fetching current company:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch current company from Tally',
        hint: 'Make sure a company is open in Tally',
      },
      { status: 500 }
    );
  }
}

function parseCurrentCompanyXML(xml: string): CurrentCompany | null {
  // Extract company information from XML
  const extractValue = (tagName: string): string => {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
  };
  
  const name = extractValue('FldName') || extractValue('NAME');
  
  // If no company name found, no company is open
  if (!name || name === '') {
    return null;
  }
  
  return {
    name: name,
    guid: extractValue('FldGUID') || extractValue('GUID'),
    companyNumber: extractValue('FldNumber') || extractValue('COMPANYNUMBER'),
    address: extractValue('FldAddress') || extractValue('ADDRESS'),
    email: extractValue('FldEmail') || extractValue('EMAIL'),
    phone: extractValue('FldPhone') || extractValue('PHONENUMBER'),
    booksFrom: extractValue('FldBooksFrom') || extractValue('BOOKSFROM'),
    startingFrom: extractValue('FldStartingFrom') || extractValue('STARTINGFROM'),
    pinCode: extractValue('FldPinCode') || extractValue('PINCODE'),
    state: extractValue('FldState') || extractValue('STATE'),
    country: extractValue('FldCountry') || extractValue('COUNTRY'),
  };
}