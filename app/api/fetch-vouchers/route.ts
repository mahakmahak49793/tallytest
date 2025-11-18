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

interface Voucher {
  voucherNumber: string;
  voucherType: string;
  date: string;
  voucherName: string;
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

    // Build Tally XML request
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

        console.log(`\n=== VOUCHER ${i + 1} DEBUG ===`);
        console.log('Voucher Number:', getField(voucher.VOUCHERNUMBER));
        console.log('Available top-level keys:', Object.keys(voucher).slice(0, 30));
        
        // Extract ledger entries for amount calculation
        let ledgerEntry = null;
        let voucherAmount = 0;

        // Strategy 1: Try ALLLEDGERENTRIES.LIST (most common in Day Book/Voucher Register)
        if (voucher['ALLLEDGERENTRIES.LIST'] && Array.isArray(voucher['ALLLEDGERENTRIES.LIST'])) {
          const entries = voucher['ALLLEDGERENTRIES.LIST'];
          console.log('✓ Found ALLLEDGERENTRIES.LIST with', entries.length, 'entries');
          
          // Log first entry keys to debug
          if (entries.length > 0) {
            console.log('First ledger entry keys:', Object.keys(entries[0]).filter(k => !k.includes('LIST')));
            console.log('Has AMOUNT field:', !!entries[0].AMOUNT);
            console.log('Has Amount field:', !!entries[0].Amount);
            
            // Log the actual AMOUNT value if it exists
            if (entries[0].AMOUNT) {
              console.log('AMOUNT value:', entries[0].AMOUNT);
            }
          }
          
          // Get first non-cash ledger for party name
          ledgerEntry = entries.find(entry => {
            const ledgerName = getField(entry.LEDGERNAME || '');
            return ledgerName && ledgerName.toLowerCase() !== 'cash';
          }) || entries[0];
          
          // Calculate amount from all entries
          for (const entry of entries) {
            let amountStr = '0';
            
            // Try different field names
            if (entry.AMOUNT) {
              amountStr = getField(entry.AMOUNT);
              console.log('  → Ledger:', getField(entry.LEDGERNAME), '| AMOUNT:', amountStr);
            } else if (entry.Amount) {
              amountStr = getField(entry.Amount);
              console.log('  → Ledger:', getField(entry.LEDGERNAME), '| Amount:', amountStr);
            } else {
              console.log('  → Ledger:', getField(entry.LEDGERNAME), '| No amount field found');
              // Log first 10 keys to help debug
              console.log('     Available keys:', Object.keys(entry).filter(k => !k.includes('LIST')).slice(0, 10));
            }
            
            // Clean and parse amount (remove currency symbols, commas, etc.)
            const cleanAmount = amountStr.toString()
              .replace(/₹/g, '')
              .replace(/,/g, '')
              .replace(/\s/g, '')
              .trim();
            
            const amount = parseFloat(cleanAmount || '0');
            
            if (!isNaN(amount) && amount !== 0) {
              voucherAmount += Math.abs(amount);
              console.log('     Parsed amount:', amount, '→ Running total:', voucherAmount);
            }
          }
        }
        
        // Strategy 2: Try ALLLEDGERENTRIES array
        else if (Array.isArray(voucher.ALLLEDGERENTRIES)) {
          const entries = voucher.ALLLEDGERENTRIES;
          console.log('✓ Found ALLLEDGERENTRIES array with', entries.length, 'entries');
          
          if (entries.length > 0) {
            console.log('First entry keys:', Object.keys(entries[0]).slice(0, 20));
          }
          
          ledgerEntry = entries.find((entry :any)=> {
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
            
            if (!isNaN(amount) && amount !== 0) {
              voucherAmount += Math.abs(amount);
            }
          }
        }
        
        // Strategy 3: Try LEDGERENTRIES
        else if (voucher.LEDGERENTRIES) {
          console.log('✓ Found LEDGERENTRIES');
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
            if (!isNaN(amount) && amount !== 0) {
              voucherAmount += Math.abs(amount);
            }
          }
        }

        // Strategy 4: Try direct voucher amount fields
        if (voucherAmount === 0) {
          console.log('⚠ No amount from ledger entries, trying direct fields...');
          const directAmount = getField(
            voucher.AMOUNT || 
            voucher.Amount ||
            voucher.TOTALAMOUNT ||
            voucher.TotalAmount ||
            '0'
          );
          console.log('Direct amount field value:', directAmount);
          
          const cleanAmount = directAmount.toString()
            .replace(/₹/g, '')
            .replace(/,/g, '')
            .replace(/\s/g, '')
            .trim();
          
          voucherAmount = parseFloat(cleanAmount || '0');
          
          if (isNaN(voucherAmount)) {
            voucherAmount = 0;
          }
        }

        console.log('✓ Final voucher amount:', voucherAmount);

        vouchers.push({
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
          amount: Math.abs(voucherAmount),
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
        debug: {
          companyName,
          fromDate: fromDate || '01-04-2025',
          toDate: toDate || '30-04-2025',
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
            `4. Company "${process.env.TALLY_COMPANY_NAME || 'GennextIT'}" is loaded`
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