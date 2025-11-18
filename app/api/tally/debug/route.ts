// app/api/tally/debug/route.ts
import { analyzeXMLStructure } from '@/app/lib/tallyXmlParser';
import { NextRequest, NextResponse } from 'next/server';

const TALLY_URL = process.env.TALLY_SERVER_URL || 'http://localhost:9000';

export async function POST(request: NextRequest) {
  try {
    const { masterType = 'ledgers', xmlRequest: customXml } = await request.json();
    
    // Use custom XML or build default
    const xmlRequest = customXml || buildDebugXMLRequest(masterType);
    
    console.log('=== DEBUG REQUEST ===');
    console.log('Tally URL:', TALLY_URL);
    console.log('Master Type:', masterType);
    console.log('XML Request:\n', xmlRequest);
    
    const response = await fetch(TALLY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': xmlRequest.length.toString(),
      },
      body: xmlRequest,
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Tally server returned status ${response.status}`,
        status: response.status,
        statusText: response.statusText,
      });
    }

    const xmlData = await response.text();
    console.log('Response Length:', xmlData.length);
    
    // Analyze structure
    const structure = analyzeXMLStructure(xmlData);
    
    return NextResponse.json({
      success: true,
      masterType,
      xmlRequest,
      responseLength: xmlData.length,
      rawXmlPreview: xmlData.substring(0, 2000),
      fullXml: xmlData, // Full XML for debugging
      structure,
      analysis: {
        hasEnvelope: xmlData.includes('<ENVELOPE>'),
        hasBody: xmlData.includes('<BODY>'),
        hasTallyMessage: xmlData.includes('<TALLYMESSAGE>'),
        hasLedger: xmlData.includes('<LEDGER>'),
        hasCollection: xmlData.includes('<COLLECTION>'),
      }
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

function buildDebugXMLRequest(masterType: string): string {
  const requests: { [key: string]: string } = {
    // Method 1: Using Export Data with Report Name
    ledgers_v1: `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<REPORTNAME>List of Accounts</REPORTNAME>
<STATICVARIABLES>
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
</STATICVARIABLES>
</REQUESTDESC>
</EXPORTDATA>
</BODY>
</ENVELOPE>`,

    // Method 2: Using Collection
    ledgers_v2: `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<REPORTNAME>All Masters</REPORTNAME>
<STATICVARIABLES>
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
<EXPLODEFLAG>Yes</EXPLODEFLAG>
<MASTERNAME>Ledger</MASTERNAME>
</STATICVARIABLES>
</REQUESTDESC>
</EXPORTDATA>
</BODY>
</ENVELOPE>`,

    // Method 3: Using TDL Collection
    ledgers_v3: `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<REPORTNAME>Ledgers</REPORTNAME>
<STATICVARIABLES>
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
</STATICVARIABLES>
</REQUESTDESC>
<TDLMESSAGE>
<COLLECTION NAME="AllLedgers" TYPE="Ledger">
<FILTERS>
</FILTERS>
</COLLECTION>
</TDLMESSAGE>
</EXPORTDATA>
</BODY>
</ENVELOPE>`,

    // Company Info Test
    company: `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<REPORTNAME>Company Info</REPORTNAME>
<STATICVARIABLES>
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
</STATICVARIABLES>
</REQUESTDESC>
</EXPORTDATA>
</BODY>
</ENVELOPE>`,
  };
  
  return requests[masterType] || requests.ledgers_v1;
}

// GET endpoint to test Tally connectivity
export async function GET() {
  try {
    const xmlRequest = `<ENVELOPE>
<HEADER>
<TALLYREQUEST>Export Data</TALLYREQUEST>
</HEADER>
<BODY>
<EXPORTDATA>
<REQUESTDESC>
<REPORTNAME>List of Companies</REPORTNAME>
<STATICVARIABLES>
<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
</STATICVARIABLES>
</REQUESTDESC>
</EXPORTDATA>
</BODY>
</ENVELOPE>`;

    const response = await fetch(TALLY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlRequest,
    });

    const xmlData = await response.text();

    return NextResponse.json({
      success: response.ok,
      tallyUrl: TALLY_URL,
      status: response.status,
      connected: response.ok,
      response: xmlData.substring(0, 1000),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      tallyUrl: TALLY_URL,
      error: error.message,
      connected: false,
    });
  }
}