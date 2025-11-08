// app/api/ledgers/route.ts
import axios from "axios";
import xml2js from "xml2js";
import { NextRequest } from "next/server";

const TALLY_URL = "http://localhost:9000/";

// Define interfaces for Tally response structure
interface TallyLedger {
  NAME?: string;
  PARENT?: string;
  OPENINGBALANCE?: string | { _?: string };
  CLOSINGBALANCE?: string | { _?: string };
  LEDGERNAME?: string;
  $?: {
    NAME?: string;
  };
}

interface TallyMessage {
  LEDGER?: TallyLedger;
  LEDGERLIST?: TallyLedger;
}

interface TallyResponse {
  ENVELOPE?: {
    BODY?: {
      EXPORTDATA?: {
        TALLYMESSAGE?: TallyMessage[] | TallyMessage;
        REQUESTDATA?: any;
        [key: string]: any;
      };
      DATA?: any;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

// Fix: Make all properties required in the type but allow null
interface NormalizedLedger {
  name: string | null;
  parent: string | null;
  openingBalance: string | null;
  closingBalance: string | null;
  raw?: TallyLedger;
}

// helper: build request XML for ledger list
function buildLedgerRequestXML(companyName: string | null): string {
  return `<?xml version="1.0"?>
  <ENVELOPE>
    <HEADER>
      <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
      <EXPORTDATA>
        <REQUESTDESC>
          <REPORTNAME>List of Accounts</REPORTNAME>
          <STATICVARIABLES>
            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            ${companyName ? `<SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>` : ""}
          </STATICVARIABLES>
        </REQUESTDESC>
      </EXPORTDATA>
    </BODY>
  </ENVELOPE>`;
}

// Type guard function for the filter
function isNotNull<T>(item: T | null): item is T {
  return item !== null;
}

// normalize the xml2js result into a flat ledger array as much as possible
function normalizeLedgers(parsed: TallyResponse): NormalizedLedger[] {
  try {
    const dataBlock = parsed?.ENVELOPE?.BODY?.EXPORTDATA?.TALLYMESSAGE;

    // Handle array of TALLYMESSAGE
    if (Array.isArray(dataBlock)) {
      const ledgers = dataBlock
        .map((item: TallyMessage): NormalizedLedger | null => {
          const ledger = item.LEDGER || item.LEDGERLIST || null;
          if (!ledger) return null;

          return {
            name: ledger?.NAME || ledger?.$?.NAME || ledger?.LEDGERNAME || null,
            parent: ledger?.PARENT || null,
            openingBalance: typeof ledger?.OPENINGBALANCE === 'string' 
              ? ledger.OPENINGBALANCE 
              : ledger?.OPENINGBALANCE?._ || null,
            closingBalance: typeof ledger?.CLOSINGBALANCE === 'string'
              ? ledger.CLOSINGBALANCE
              : ledger?.CLOSINGBALANCE?._ || null,
            raw: ledger,
          };
        })
        .filter(isNotNull); // Use the type guard here
      
      if (ledgers.length) return ledgers;
    }

    // Handle single TALLYMESSAGE object
    if (dataBlock && !Array.isArray(dataBlock)) {
      const ledger = (dataBlock as TallyMessage).LEDGER || (dataBlock as TallyMessage).LEDGERLIST;
      if (ledger) {
        return [{
          name: ledger?.NAME || ledger?.$?.NAME || ledger?.LEDGERNAME || null,
          parent: ledger?.PARENT || null,
          openingBalance: typeof ledger?.OPENINGBALANCE === 'string'
            ? ledger.OPENINGBALANCE
            : ledger?.OPENINGBALANCE?._ || null,
          closingBalance: typeof ledger?.CLOSINGBALANCE === 'string'
            ? ledger.CLOSINGBALANCE
            : ledger?.CLOSINGBALANCE?._ || null,
          raw: ledger,
        }];
      }
    }

    // fallback: recursive traversal to find LEDGER objects
    const found: NormalizedLedger[] = [];
    
    function traverse(obj: any): void {
      if (!obj || typeof obj !== "object") return;
      
      if (obj.LEDGER) {
        const l: TallyLedger = obj.LEDGER;
        found.push({
          name: l?.NAME || l?.$?.NAME || null,
          parent: l?.PARENT || null,
          openingBalance: typeof l?.OPENINGBALANCE === 'string'
            ? l.OPENINGBALANCE
            : l?.OPENINGBALANCE?._ || null,
          closingBalance: typeof l?.CLOSINGBALANCE === 'string'
            ? l.CLOSINGBALANCE
            : l?.CLOSINGBALANCE?._ || null,
          raw: l,
        });
      }
      
      for (const k of Object.keys(obj)) {
        traverse(obj[k]);
      }
    }
    
    traverse(parsed);
    return found;
  } catch (err) {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const company = url.searchParams.get("company") || "";

  const xml = buildLedgerRequestXML(company);

  try {
    const response = await axios.post(TALLY_URL, xml, {
      headers: { "Content-Type": "text/xml" },
      timeout: 15000,
    });

    const parsed: TallyResponse = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
      mergeAttrs: true,
      charkey: "_",
      trim: true,
    });

    // normalize into ledger list
    const ledgers = normalizeLedgers(parsed);

    return new Response(
      JSON.stringify({
        success: true,
        company: company || null,
        ledgers,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const message = error?.message || "Unknown error";
    const body = error?.response?.data || null;
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch ledgers from Tally",
        error: message,
        body,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}