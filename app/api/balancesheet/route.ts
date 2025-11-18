// app/api/balance-sheet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseString } from 'xml2js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate') || '20240401';
    const toDate = searchParams.get('toDate') || '20250331';

    // Tally XML request for Balance Sheet
    const tallyXML = `
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Data</TYPE>
          <ID>Balance Sheet</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              <SVFROMDATE>${fromDate}</SVFROMDATE>
              <SVTODATE>${toDate}</SVTODATE>
            </STATICVARIABLES>
            <TDL>
              <TDLMESSAGE>
                <REPORT NAME="Balance Sheet">
                  <FORMS>Balance Sheet</FORMS>
                </REPORT>
              </TDLMESSAGE>
            </TDL>
          </DESC>
        </BODY>
      </ENVELOPE>
    `;

    // Fetch from Tally (default port 9000)
    const tallyUrl = process.env.TALLY_URL || 'http://localhost:9000';
    
    const response = await fetch(tallyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: tallyXML,
    });

    if (!response.ok) {
      throw new Error(`Tally API error: ${response.statusText}`);
    }

    const xmlData = await response.text();

    // Parse XML to JSON
    const jsonData = await new Promise((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return NextResponse.json({
      success: true,
      data: jsonData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}