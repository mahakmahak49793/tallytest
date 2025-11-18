import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const TALLY_BASE_URL = process.env.TALLY_URL || 'http://localhost:9000';
const COMPANY_NAME = process.env.TALLY_COMPANY_NAME || 'GennextIT';

// Build Tally XML request to fetch vouchers with GUID extraction
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

// Build Tally XML to create voucher (returns GUID in response)
function buildCreateVoucherXML(voucherData: any) {
  const {
    voucherType,
    voucherNumber,
    date,
    partyName,
    amount,
    narration,
    ledgerName,
  } = voucherData;

  // Format date to Tally format (YYYYMMDD)
  const formattedDate = date.replace(/-/g, '');
  
  // Format amount with 2 decimal places
  const formattedAmount = parseFloat(amount).toFixed(2);

  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${COMPANY_NAME}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER REMOTEID="" VCHKEY="" VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${formattedDate}</DATE>
            <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
            <NARRATION>${narration || ''}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${partyName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${formattedAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${ledgerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-${formattedAmount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

interface Voucher {
  guid: string;
  masterId: string;
  voucherNumber: string;
  voucherType: string;
  date: string;
  voucherName: string;
  amount: number;
  debitAmount: number;
  creditAmount: number;
  narration: string;
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

// GET - Fetch all vouchers with GUIDs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    console.log('Fetching vouchers from Tally...');

    // Build Tally XML request
    const tallyXML = buildVouchersXML(COMPANY_NAME, fromDate || undefined, toDate || undefined);
    
    console.log('Sending XML to Tally:', tallyXML);

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

    console.log('Tally Response received, length:', response.data.length);

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

    console.log('XML Parsed successfully');
    
    // Extract vouchers from parsed XML
    const vouchers: Voucher[] = [];
    
    // Try multiple possible XML structures
    let voucherData = null;
    
    // Structure 1: ENVELOPE > BODY > DATA > COLLECTION > VOUCHER
    if (parsedData?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.COLLECTION?.[0]?.VOUCHER) {
      voucherData = parsedData.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].VOUCHER;
      console.log('Found vouchers in Structure 1 (DATA.COLLECTION.VOUCHER)');
    }
    // Structure 2: ENVELOPE > BODY > EXPORTDATA > REQUESTDATA > TALLYMESSAGE > VOUCHER
    else if (parsedData?.ENVELOPE?.BODY?.[0]?.EXPORTDATA?.[0]?.REQUESTDATA?.[0]?.TALLYMESSAGE) {
      const messages = parsedData.ENVELOPE.BODY[0].EXPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE;
      voucherData = messages.filter((msg: any) => msg.VOUCHER).map((msg: any) => msg.VOUCHER[0]);
      console.log('Found vouchers in Structure 2 (EXPORTDATA.TALLYMESSAGE)');
    }
    // Structure 3: ENVELOPE > BODY > IMPORTDATA > REQUESTDATA > TALLYMESSAGE > VOUCHER
    else if (parsedData?.ENVELOPE?.BODY?.[0]?.IMPORTDATA?.[0]?.REQUESTDATA?.[0]?.TALLYMESSAGE) {
      const messages = parsedData.ENVELOPE.BODY[0].IMPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE;
      voucherData = messages.filter((msg: any) => msg.VOUCHER).map((msg: any) => msg.VOUCHER[0]);
      console.log('Found vouchers in Structure 3 (IMPORTDATA.TALLYMESSAGE)');
    }
    // Structure 4: Direct VOUCHER array
    else if (parsedData?.ENVELOPE?.VOUCHER) {
      voucherData = parsedData.ENVELOPE.VOUCHER;
      console.log('Found vouchers in Structure 4 (Direct VOUCHER)');
    }

    if (voucherData && Array.isArray(voucherData)) {
      console.log(`Processing ${voucherData.length} vouchers...`);
      
      for (let i = 0; i < voucherData.length; i++) {
        const voucher = voucherData[i];
        
        const getField = (field: any) => {
          if (Array.isArray(field)) return field[0] || '';
          return field || '';
        };

        // Extract GUID and MASTERID
        const guid = getField(voucher.GUID);
        const masterId = getField(voucher.MASTERID);

        // Extract ledger entries for amount calculation
        let ledgerEntry = null;
        let debitAmount = 0;
        let creditAmount = 0;

        // Strategy 1: Try ALLLEDGERENTRIES.LIST (most common in Day Book/Voucher Register)
        if (voucher['ALLLEDGERENTRIES.LIST'] && Array.isArray(voucher['ALLLEDGERENTRIES.LIST'])) {
          const entries = voucher['ALLLEDGERENTRIES.LIST'];
          
          // Get first non-cash ledger for party name
          ledgerEntry = entries.find((entry: any) => {
            const ledgerName = getField(entry.LEDGERNAME || '');
            return ledgerName && ledgerName.toLowerCase() !== 'cash';
          }) || entries[0];
          
          // Calculate debit and credit amounts separately
          for (const entry of entries) {
            let amountStr = '0';
            
            // Try different field names
            if (entry.AMOUNT) {
              amountStr = getField(entry.AMOUNT);
            } else if (entry.Amount) {
              amountStr = getField(entry.Amount);
            }
            
            // Clean and parse amount (remove currency symbols, commas, etc.)
            const cleanAmount = amountStr.toString()
              .replace(/₹/g, '')
              .replace(/,/g, '')
              .replace(/\s/g, '')
              .trim();
            
            const amount = parseFloat(cleanAmount || '0');
            
            if (!isNaN(amount)) {
              if (amount > 0) {
                debitAmount += amount;
              } else if (amount < 0) {
                creditAmount += Math.abs(amount);
              }
            }
          }
        }
        
        // Strategy 2: Try ALLLEDGERENTRIES array
        else if (Array.isArray(voucher.ALLLEDGERENTRIES)) {
          const entries = voucher.ALLLEDGERENTRIES;
          
          ledgerEntry = entries.find((entry: any) => {
            const ledgerName = getField(entry.LEDGERNAME || entry.LedgerName || '');
            return ledgerName && ledgerName.toLowerCase() !== 'cash';
          }) || entries[0];
          
          for (const entry of entries) {
            let amountStr = '0';
            
            if (entry.AMOUNT) {
              amountStr = getField(entry.AMOUNT);
            } else if (entry.Amount) {
              amountStr = getField(entry.Amount);
            }
            
            const cleanAmount = amountStr.toString()
              .replace(/₹/g, '')
              .replace(/,/g, '')
              .replace(/\s/g, '')
              .trim();
            
            const amount = parseFloat(cleanAmount || '0');
            
            if (!isNaN(amount)) {
              if (amount > 0) {
                debitAmount += amount;
              } else if (amount < 0) {
                creditAmount += Math.abs(amount);
              }
            }
          }
        }
        
        // Strategy 3: Try LEDGERENTRIES
        else if (voucher.LEDGERENTRIES) {
          const entries = Array.isArray(voucher.LEDGERENTRIES) 
            ? voucher.LEDGERENTRIES 
            : [voucher.LEDGERENTRIES];
            
          ledgerEntry = entries[0];
            
          for (const entry of entries) {
            const amountStr = getField(entry.AMOUNT || entry.Amount || '0');
            const cleanAmount = amountStr.toString()
              .replace(/₹/g, '')
              .replace(/,/g, '')
              .replace(/\s/g, '')
              .trim();
            
            const amount = parseFloat(cleanAmount || '0');
            if (!isNaN(amount)) {
              if (amount > 0) {
                debitAmount += amount;
              } else if (amount < 0) {
                creditAmount += Math.abs(amount);
              }
            }
          }
        }

        // Strategy 4: Try direct voucher amount fields
        if (debitAmount === 0 && creditAmount === 0) {
          const directAmount = getField(
            voucher.AMOUNT || 
            voucher.Amount ||
            voucher.TOTALAMOUNT ||
            voucher.TotalAmount ||
            '0'
          );
          
          const cleanAmount = directAmount.toString()
            .replace(/₹/g, '')
            .replace(/,/g, '')
            .replace(/\s/g, '')
            .trim();
          
          const amount = parseFloat(cleanAmount || '0');
          
          if (!isNaN(amount)) {
            if (amount > 0) {
              debitAmount = amount;
            } else {
              creditAmount = Math.abs(amount);
            }
          }
        }

        vouchers.push({
          guid: guid,
          masterId: masterId,
          voucherNumber: getField(voucher.VOUCHERNUMBER),
          voucherType: getField(voucher.VOUCHERTYPENAME || voucher.VOUCHERTYPE),
          date: formatDate(getField(voucher.DATE)),
          voucherName: getField(
            ledgerEntry?.LEDGERNAME ||
            ledgerEntry?.LedgerName ||
            voucher.PARTYLEDGERNAME ||
            voucher.PARTYNAME ||
            ""
          ),
          amount: Math.max(debitAmount, creditAmount),
          debitAmount: debitAmount,
          creditAmount: creditAmount,
          narration: getField(voucher.NARRATION),
        });
      }
    } else {
      console.log('⚠ No voucher data found in any known structure');
      console.log('Response structure:', Object.keys(parsedData?.ENVELOPE?.BODY?.[0] || {}));
    }

    console.log(`\n✓ Successfully processed ${vouchers.length} vouchers`);

    return NextResponse.json(
      { 
        success: true,
        count: vouchers.length,
        vouchers: vouchers,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching Tally vouchers:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: 'Cannot connect to Tally. Please ensure Tally is running with ODBC enabled.',
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
      },
      { status: 500 }
    );
  }
}

// POST - Create new voucher (returns GUID in response)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'voucherType',
      'voucherNumber',
      'date',
      'partyName',
      'amount',
      'ledgerName',
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate amount is a valid number
    if (isNaN(parseFloat(body.amount))) {
      return NextResponse.json(
        { error: 'Amount must be a valid number' },
        { status: 400 }
      );
    }

    // Build Tally XML request
    const tallyXML = buildCreateVoucherXML(body);

    console.log('Creating voucher in Tally:', body.voucherNumber);

    // Send request to Tally
    const response = await axios.post(
      TALLY_BASE_URL,
      tallyXML,
      {
        headers: {
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
        },
        timeout: 10000,
      }
    );

    console.log('Tally Response:', response.data);

    // Extract GUID from response if available
    let guid = '';
    let masterId = '';
    
    try {
      const parsedResponse = await parseStringPromise(response.data, {
        explicitArray: true,
        mergeAttrs: true
      });
      
      // Try to extract GUID and MASTERID from response
      if (parsedResponse?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.VOUCHER) {
        const voucherResp = parsedResponse.ENVELOPE.BODY[0].DATA[0].VOUCHER[0];
        guid = Array.isArray(voucherResp.GUID) ? voucherResp.GUID[0] : voucherResp.GUID || '';
        masterId = Array.isArray(voucherResp.MASTERID) ? voucherResp.MASTERID[0] : voucherResp.MASTERID || '';
      }
    } catch (parseError) {
      console.log('Could not parse GUID from response');
    }

    // Check for success indicators in Tally response
    if (response.data.includes('CREATED') || 
        response.data.includes('SUCCESS') || 
        response.data.includes('<CREATED>1</CREATED>')) {
      return NextResponse.json(
        {
          success: true,
          message: `Voucher ${body.voucherNumber} created successfully in Tally`,
          guid: guid,
          masterId: masterId,
        },
        { status: 200 }
      );
    } else if (
      response.data.includes('ERROR') ||
      response.data.includes('FAILED') ||
      response.data.includes('<LINEERROR>')
    ) {
      return NextResponse.json(
        { 
          error: 'Tally returned an error. Please check the voucher details.',
          details: response.data 
        },
        { status: 400 }
      );
    } else {
      // If we can't determine the response, return success
      return NextResponse.json(
        {
          success: true,
          message: `Voucher ${body.voucherNumber} created successfully`,
          guid: guid,
          masterId: masterId,
        },
        { status: 200 }
      );
    }

  } catch (error: any) {
    console.error('Error creating Tally voucher:', error);

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'Cannot connect to Tally. Please ensure Tally is running with XML capabilities enabled.',
        },
        { status: 503 }
      );
    }

    if (error.response) {
      console.error('Tally error response:', error.response.data);
      return NextResponse.json(
        {
          error: `Tally responded with error: ${error.response.status}`,
          details: error.response.data,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create voucher in Tally' },
      { status: 500 }
    );
  }
}