import { NextRequest, NextResponse } from 'next/server';

// Tally API configuration
const TALLY_CONFIG = {
  baseUrl: process.env.TALLY_BASE_URL || 'http://localhost:9000',
  company: process.env.TALLY_COMPANY_NAME || 'Default Company',
  timeout: parseInt(process.env.TALLY_TIMEOUT || '30000')
};

// Tally XML request templates
const TALLY_REQUESTS = {
  dayBook: (fromDate: string, toDate: string, voucherType?: string) => `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Day Book</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVFROMDATE>${fromDate}</SVFROMDATE>
          <SVTODATE>${toDate}</SVTODATE>
          ${voucherType ? `<SVCURRENTCOMPANY>${voucherType}</SVCURRENTCOMPANY>` : ''}
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`,

  salesRegister: (fromDate: string, toDate: string) => `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Sales Register</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVFROMDATE>${fromDate}</SVFROMDATE>
          <SVTODATE>${toDate}</SVTODATE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`,

  balanceSheet: (asOnDate: string) => `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Balance Sheet</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${TALLY_CONFIG.company}</SVCURRENTCOMPANY>
          <SVFROMDATE>${asOnDate}</SVFROMDATE>
          <SVTODATE>${asOnDate}</SVTODATE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`,

  profitLoss: (fromDate: string, toDate: string) => `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Profit & Loss</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${TALLY_CONFIG.company}</SVCURRENTCOMPANY>
          <SVFROMDATE>${fromDate}</SVFROMDATE>
          <SVTODATE>${toDate}</SVTODATE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`,

  ledgerSummary: (fromDate: string, toDate: string) => `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Ledgers</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${TALLY_CONFIG.company}</SVCURRENTCOMPANY>
          <SVFROMDATE>${fromDate}</SVFROMDATE>
          <SVTODATE>${toDate}</SVTODATE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`
};

// Utility function to fetch data from Tally
async function fetchFromTally(xmlRequest: string): Promise<any> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TALLY_CONFIG.timeout);

    const response = await fetch(`${TALLY_CONFIG.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlRequest,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Tally API responded with status: ${response.status}`);
    }

    const xmlText = await response.text();
    return parseTallyXMLResponse(xmlText);
  } catch (error) {
    console.error('Tally API Error:', error);
    throw new Error(`Failed to connect to Tally: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Parse Tally XML response
function parseTallyXMLResponse(xmlText: string): any {
  try {
    // Basic XML parsing - you might want to use a proper XML parser like 'xml2js'
    // This is a simplified version
    
    // Check for errors in response
    if (xmlText.includes('<ERROR>')) {
      const errorMatch = xmlText.match(/<ERROR>([\s\S]*?)<\/ERROR>/);
      throw new Error(errorMatch ? errorMatch[1] : 'Unknown Tally error');
    }

    // Parse based on response type
    if (xmlText.includes('<DAYBOOK>')) {
      return parseDayBookResponse(xmlText);
    } else if (xmlText.includes('<SALESREGISTER>')) {
      return parseSalesRegisterResponse(xmlText);
    } else if (xmlText.includes('<BALANCESHEET>')) {
      return parseBalanceSheetResponse(xmlText);
    } else if (xmlText.includes('<PROFITANDLOSS>')) {
      return parseProfitLossResponse(xmlText);
    } else if (xmlText.includes('<LEDGER>')) {
      return parseLedgerSummaryResponse(xmlText);
    }

    throw new Error('Unknown response format from Tally');
  } catch (error) {
    console.error('XML Parsing Error:', error);
    throw new Error('Failed to parse Tally response');
  }
}

// Parser functions for different report types
function parseDayBookResponse(xmlText: string): any[] {
  const vouchers: any[] = [];
  
  // Extract voucher data using regex (simplified - consider using proper XML parser)
  const voucherRegex = /<VOUCHER>([\s\S]*?)<\/VOUCHER>/g;
  let voucherMatch;
  
  while ((voucherMatch = voucherRegex.exec(xmlText)) !== null) {
    const voucherContent = voucherMatch[1];
    
    const voucher = {
      id: extractValue(voucherContent, 'VOUCHERNUMBER'),
      date: extractValue(voucherContent, 'DATE'),
      voucherType: extractValue(voucherContent, 'VOUCHERTYPENAME'),
      voucherNumber: extractValue(voucherContent, 'VOUCHERNUMBER'),
      partyName: extractValue(voucherContent, 'PARTYNAME'),
      amount: parseFloat(extractValue(voucherContent, 'AMOUNT') || '0'),
      narration: extractValue(voucherContent, 'NARRATION')
    };
    
    vouchers.push(voucher);
  }
  
  return vouchers;
}

function parseSalesRegisterResponse(xmlText: string): any[] {
  const sales: any[] = [];
  
  const saleRegex = /<SALE>([\s\S]*?)<\/SALE>/g;
  let saleMatch;
  
  while ((saleMatch = saleRegex.exec(xmlText)) !== null) {
    const saleContent = saleMatch[1];
    
    const saleRecord = {
      id: extractValue(saleContent, 'INVOICENUMBER'),
      date: extractValue(saleContent, 'DATE'),
      invoiceNo: extractValue(saleContent, 'INVOICENUMBER'),
      customerName: extractValue(saleContent, 'PARTYNAME'),
      taxableAmount: parseFloat(extractValue(saleContent, 'TAXABLEAMOUNT') || '0'),
      taxAmount: parseFloat(extractValue(saleContent, 'TOTALTAX') || '0'),
      totalAmount: parseFloat(extractValue(saleContent, 'AMOUNT') || '0')
    };
    
    sales.push(saleRecord);
  }
  
  return sales;
}

function parseBalanceSheetResponse(xmlText: string): any {
  const assets: any[] = [];
  const liabilities: any[] = [];
  
  // Parse assets
  const assetRegex = /<ASSET>([\s\S]*?)<\/ASSET>/g;
  let assetMatch;
  
  while ((assetMatch = assetRegex.exec(xmlText)) !== null) {
    const assetContent = assetMatch[1];
    
    assets.push({
      name: extractValue(assetContent, 'NAME'),
      amount: parseFloat(extractValue(assetContent, 'AMOUNT') || '0')
    });
  }
  
  // Parse liabilities
  const liabilityRegex = /<LIABILITY>([\s\S]*?)<\/LIABILITY>/g;
  let liabilityMatch;
  
  while ((liabilityMatch = liabilityRegex.exec(xmlText)) !== null) {
    const liabilityContent = liabilityMatch[1];
    
    liabilities.push({
      name: extractValue(liabilityContent, 'NAME'),
      amount: parseFloat(extractValue(liabilityContent, 'AMOUNT') || '0')
    });
  }
  
  return { assets, liabilities };
}

function parseProfitLossResponse(xmlText: string): any {
  const income: any[] = [];
  const expenses: any[] = [];
  
  // Parse income
  const incomeRegex = /<INCOME>([\s\S]*?)<\/INCOME>/g;
  let incomeMatch;
  
  while ((incomeMatch = incomeRegex.exec(xmlText)) !== null) {
    const incomeContent = incomeMatch[1];
    
    income.push({
      name: extractValue(incomeContent, 'NAME'),
      amount: parseFloat(extractValue(incomeContent, 'AMOUNT') || '0')
    });
  }
  
  // Parse expenses
  const expenseRegex = /<EXPENSE>([\s\S]*?)<\/EXPENSE>/g;
  let expenseMatch;
  
  while ((expenseMatch = expenseRegex.exec(xmlText)) !== null) {
    const expenseContent = expenseMatch[1];
    
    expenses.push({
      name: extractValue(expenseContent, 'NAME'),
      amount: parseFloat(extractValue(expenseContent, 'AMOUNT') || '0')
    });
  }
  
  return { income, expenses };
}

function parseLedgerSummaryResponse(xmlText: string): any[] {
  const ledgers: any[] = [];
  
  const ledgerRegex = /<LEDGER>([\s\S]*?)<\/LEDGER>/g;
  let ledgerMatch;
  
  while ((ledgerMatch = ledgerRegex.exec(xmlText)) !== null) {
    const ledgerContent = ledgerMatch[1];
    
    const ledger = {
      name: extractValue(ledgerContent, 'NAME'),
      openingBalance: parseFloat(extractValue(ledgerContent, 'OPENINGBALANCE') || '0'),
      debit: parseFloat(extractValue(ledgerContent, 'DEBIT') || '0'),
      credit: parseFloat(extractValue(ledgerContent, 'CREDIT') || '0'),
      closingBalance: parseFloat(extractValue(ledgerContent, 'CLOSINGBALANCE') || '0')
    };
    
    ledgers.push(ledger);
  }
  
  return ledgers;
}

// Helper function to extract values from XML
function extractValue(xmlContent: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\/${tagName}>`);
  const match = xmlContent.match(regex);
  return match ? match[1].trim() : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, fromDate, toDate, filters } = body;

    // Validate required fields
    if (!reportType) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      );
    }

    // Validate dates for reports that require them
    if (reportType !== 'balanceSheet' && (!fromDate || !toDate)) {
      return NextResponse.json(
        { error: 'From date and to date are required for this report' },
        { status: 400 }
      );
    }

    let xmlRequest: string;
    let responseData: any;

    switch (reportType) {
      case 'dayBook':
        xmlRequest = TALLY_REQUESTS.dayBook(fromDate, toDate, filters?.voucherType);
        const dayBookData = await fetchFromTally(xmlRequest);
        responseData = {
          reportType: 'dayBook',
          data: dayBookData,
          fromDate,
          toDate,
          totalRecords: dayBookData.length
        };
        break;

      case 'salesRegister':
        xmlRequest = TALLY_REQUESTS.salesRegister(fromDate, toDate);
        const salesData = await fetchFromTally(xmlRequest);
        responseData = {
          reportType: 'salesRegister',
          data: salesData,
          fromDate,
          toDate,
          totalRecords: salesData.length
        };
        break;

      case 'balanceSheet':
        const asOnDate = toDate || new Date().toISOString().split('T')[0];
        xmlRequest = TALLY_REQUESTS.balanceSheet(asOnDate);
        const balanceSheetData = await fetchFromTally(xmlRequest);
        responseData = {
          reportType: 'balanceSheet',
          data: balanceSheetData,
          asOnDate
        };
        break;

      case 'profitLoss':
        xmlRequest = TALLY_REQUESTS.profitLoss(fromDate, toDate);
        const profitLossData = await fetchFromTally(xmlRequest);
        responseData = {
          reportType: 'profitLoss',
          data: profitLossData,
          fromDate,
          toDate
        };
        break;

      case 'ledgerSummary':
        xmlRequest = TALLY_REQUESTS.ledgerSummary(fromDate, toDate);
        const ledgerData = await fetchFromTally(xmlRequest);
        responseData = {
          reportType: 'ledgerSummary',
          data: ledgerData,
          fromDate,
          toDate,
          totalRecords: ledgerData.length
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Check if Tally is running and configured properly'
      },
      { status: 500 }
    );
  }
}