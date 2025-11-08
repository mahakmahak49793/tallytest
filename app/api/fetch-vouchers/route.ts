// app/api/fetch-vouchers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// Build Tally XML request to fetch vouchers
function buildVouchersXML(companyName: string, fromDate?: string, toDate?: string) {
  // Format dates for Tally (DD-MM-YYYY format)
  const formatDateForTally = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Use provided dates or default to current month
  const from = fromDate ? formatDateForTally(fromDate) : '01-04-2025';
  const to = toDate ? formatDateForTally(toDate) : '30-04-2025';

  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Voucher Register</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
          ${from ? `<SVFROMDATE>${from}</SVFROMDATE>` : ''}
          ${to ? `<SVTODATE>${to}</SVTODATE>` : ''}
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// Alternative simpler XML format
function buildSimpleVouchersXML(companyName: string) {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
       <REPORTNAME>Day Book</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>GennextIT</SVCURRENTCOMPANY>
          <SVFROMDATE>1-4-2025</SVFROMDATE>
          <SVTODATE>30-4-2025</SVTODATE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
}

interface Voucher {
  voucherNumber: string;
  voucherType: string;
  date: string;
  partyName: string;
  amount: number;
  narration: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const companyName = 'GennextIT';
    
    console.log('Environment variables:', {
      TALLY_URL: process.env.TALLY_URL,
      TALLY_COMPANY_NAME: process.env.TALLY_COMPANY_NAME,
      NODE_ENV: process.env.NODE_ENV
    });
    
    if (!companyName) {
      return NextResponse.json(
        { 
          error: 'TALLY_COMPANY_NAME environment variable is not set. Please add it to your .env.local file.',
          envDebug: {
            allEnvVars: Object.keys(process.env).filter(key => key.startsWith('TALLY')),
            nodeEnv: process.env.NODE_ENV
          }
        },
        { status: 400 }
      );
    }

    // Build Tally XML request - trying simpler format first
const tallyXML = buildVouchersXML(companyName, fromDate || undefined, toDate || undefined);
    
    console.log('Sending XML to Tally:', tallyXML);

    // Tally configuration
    const TALLY_BASE_URL = process.env.TALLY_URL || 'http://localhost:9000';
    
    // Send request to Tally
    const response = await axios.post(
      TALLY_BASE_URL,
      tallyXML,
      {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': Buffer.byteLength(tallyXML).toString(),
        },
        timeout: 15000,
      }
    );

    console.log('Tally Response:', response.data);

    // Check if response is an error
    if (typeof response.data === 'string' && response.data.includes('error')) {
      return NextResponse.json(
        { error: 'Tally returned an error. Check company name or Tally configuration.' },
        { status: 400 }
      );
    }

    // Parse XML response
    let parsedData;
    try {
      parsedData = await parseStringPromise(response.data, { 
        explicitArray: true,
        mergeAttrs: true 
      });
    } catch (parseError) {
      console.error('XML Parse Error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse Tally response. The XML format may be incorrect.' },
        { status: 500 }
      );
    }

    console.log('Parsed Data:', JSON.stringify(parsedData, null, 2));
    
    // Extract vouchers from parsed XML
    const vouchers: Voucher[] = [];
    
    // Try multiple possible XML structures
    let voucherData = null;
    
    // Structure 1: ENVELOPE > BODY > DATA > COLLECTION > VOUCHER
    if (parsedData?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.COLLECTION?.[0]?.VOUCHER) {
      voucherData = parsedData.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].VOUCHER;
    }
    // Structure 2: ENVELOPE > BODY > EXPORTDATA > REQUESTDATA > TALLYMESSAGE > VOUCHER
    else if (parsedData?.ENVELOPE?.BODY?.[0]?.EXPORTDATA?.[0]?.REQUESTDATA?.[0]?.TALLYMESSAGE) {
      const messages = parsedData.ENVELOPE.BODY[0].EXPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE;
      voucherData = messages.filter((msg: any) => msg.VOUCHER).map((msg: any) => msg.VOUCHER[0]);
    }
    // Structure 3: ENVELOPE > BODY > IMPORTDATA > REQUESTDATA > TALLYMESSAGE > VOUCHER
    else if (parsedData?.ENVELOPE?.BODY?.[0]?.IMPORTDATA?.[0]?.REQUESTDATA?.[0]?.TALLYMESSAGE) {
      const messages = parsedData.ENVELOPE.BODY[0].IMPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE;
      voucherData = messages.filter((msg: any) => msg.VOUCHER).map((msg: any) => msg.VOUCHER[0]);
    }
    // Structure 4: Direct VOUCHER array
    else if (parsedData?.ENVELOPE?.VOUCHER) {
      voucherData = parsedData.ENVELOPE.VOUCHER;
    }

    if (voucherData && Array.isArray(voucherData)) {
      for (const voucher of voucherData) {
        // Handle different possible field structures
        const getField = (field: any) => {
          if (Array.isArray(field)) return field[0] || '';
          return field || '';
        };

        vouchers.push({
          voucherNumber: getField(voucher.VOUCHERNUMBER || voucher.VoucherNumber),
          voucherType: getField(voucher.VOUCHERTYPENAME || voucher.VoucherTypeName || voucher.VOUCHERTYPE),
          date: formatDate(getField(voucher.DATE || voucher.Date)),
          partyName: getField(voucher.PARTYLEDGERNAME || voucher.PartyLedgerName || voucher.PARTYNAME),
          amount: Math.abs(parseFloat(getField(voucher.AMOUNT || voucher.Amount || '0').toString().replace(/[^0-9.-]/g, ''))),
          narration: getField(voucher.NARRATION || voucher.Narration),
        });
      }
    }

    return NextResponse.json(
      { 
        success: true,
        count: vouchers.length,
        vouchers: vouchers,
        debug: {
          companyName,
          xmlSent: tallyXML,
          rawResponse: typeof response.data === 'string' ? response.data.substring(0, 500) : 'Binary data'
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching Tally vouchers:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: 'Cannot connect to Tally. Please ensure:',
          details: [
            '1. Tally is running',
            '2. ODBC Server is enabled (Alt+O > Features > Enable ODBC)',
            '3. Port 9000 is accessible',
            `4. Company "${process.env.TALLY_COMPANY_NAME}" is loaded`
          ]
        },
        { status: 503 }
      );
    }
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'Request to Tally timed out. Please check your network connection.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch vouchers from Tally',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to format date from YYYYMMDD to readable format
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Remove any non-numeric characters
  const cleanDate = dateStr.replace(/[^0-9]/g, '');
  
  if (cleanDate.length !== 8) return dateStr;
  
  const year = cleanDate.substring(0, 4);
  const month = cleanDate.substring(4, 6);
  const day = cleanDate.substring(6, 8);
  
  return `${day}/${month}/${year}`;
}