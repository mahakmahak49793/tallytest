// app/api/vouchers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { parseStringPromise } from "xml2js";

const TALLY_BASE_URL = process.env.TALLY_URL || "http://localhost:9000";
const COMPANY_NAME = process.env.TALLY_COMPANY_NAME || "GennextIT";

// CORRECT XML — SAME AS YOUR WORKING DEBUG ENDPOINT
const ALL_VOUCHERS_XML = `<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>AllVouchersWithGUID</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>${COMPANY_NAME}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllVouchersWithGUID">
            <TYPE>Voucher</TYPE>
            <FETCHLIST>
              <FETCH>GUID</FETCH>
              <FETCH>MASTERID</FETCH>
              <FETCH>DATE</FETCH>
              <FETCH>VOUCHERNUMBER</FETCH>
              <FETCH>VOUCHERTYPENAME</FETCH>
              <FETCH>NARRATION</FETCH>
              <FETCH>PARTYLEDGERNAME</FETCH>
            </FETCHLIST>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

// Helper to extract value from Tally's weird { _: "value", TYPE: [...] } format
const get = (field: any): string => {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (Array.isArray(field) && field[0]) {
    if (typeof field[0] === "string") return field[0];
    if (field[0]._ !== undefined) return String(field[0]._).trim();
  }
  if (field._ !== undefined) return String(field._).trim();
  return "";
};

interface VoucherDetails {
  exists: true;
  guid: string;
  masterId: string;
  voucherNumber: string;
  voucherType: string;
  date: string;
  partyName: string;
  narration: string;
}

interface VoucherNotFound {
  exists: false;
}

type VoucherResult = VoucherDetails | VoucherNotFound;

async function findVoucherByGuid(guid: string): Promise<VoucherResult> {
  try {
    console.log(`Searching for voucher GUID: ${guid}`);

    const response = await axios.post(TALLY_BASE_URL, ALL_VOUCHERS_XML, {
      headers: { "Content-Type": "application/xml" },
      timeout: 30000,
    });

    const parsed = await parseStringPromise(response.data, {
      explicitArray: true,
      mergeAttrs: true,
      trim: true,
    });

    // CORRECT PATH — matches your debug endpoint!
    const collection = parsed?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.COLLECTION;
    if (!collection || !Array.isArray(collection)) {
      console.log("No collection found");
      return { exists: false };
    }

    const vouchers = collection[0]?.VOUCHER;
    if (!vouchers || !Array.isArray(vouchers)) {
      console.log("No vouchers in collection");
      return { exists: false };
    }

    for (const v of vouchers) {
      const vGuid = get(v.GUID);
      if (vGuid === guid) {
        console.log(`FOUND: ${get(v.VOUCHERNUMBER)} (${vGuid}) | MasterID: ${get(v.MASTERID)}`);

        return {
          exists: true,
          guid: vGuid,
          masterId: get(v.MASTERID).trim(),
          voucherNumber: get(v.VOUCHERNUMBER),
          voucherType: get(v.VOUCHERTYPENAME),
          date: get(v.DATE),
          partyName: get(v.PARTYLEDGERNAME),
          narration: get(v.NARRATION),
        };
      }
    }

    console.log(`Voucher with GUID ${guid} not found in ${vouchers.length} vouchers`);
    return { exists: false };
  } catch (error: any) {
    console.error("Tally fetch error:", error.message);
    return { exists: false };
  }
}

// Build Update XML - Using TAGNAME and TAGVALUE for identification
function buildUpdateXML(data: any, masterId: string, voucherType: string, date: string) {
  const formattedDate = date.replace(/-/g, "");
  const amount = Number(data.amount || 0).toFixed(2);
  
  // Use ledgerName as the contra entry if no party name provided
  const effectivePartyName = data.partyName || data.ledgerName;

  return `<ENVELOPE>
    <HEADER>
      <VERSION>1</VERSION>
      <TALLYREQUEST>Import</TALLYREQUEST>
      <TYPE>Data</TYPE>
      <ID>Vouchers</ID>
    </HEADER>
    <BODY>
      <DESC>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${COMPANY_NAME}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </DESC>
      <DATA>
        <TALLYMESSAGE>
          <VOUCHER DATE="${formattedDate}" TAGNAME="MASTER ID" TAGVALUE="${masterId}" ACTION="Alter" VCHTYPE="${voucherType}">
            <DATE>${formattedDate}</DATE>
            <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${data.voucherNumber || ""}</VOUCHERNUMBER>${effectivePartyName ? `
            <PARTYLEDGERNAME>${effectivePartyName}</PARTYLEDGERNAME>` : ''}
            <NARRATION>${data.narration || ""}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${data.ledgerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${effectivePartyName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-${amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </DATA>
    </BODY>
  </ENVELOPE>`;
}

// Build Delete XML - Using TAGNAME and TAGVALUE for identification
function buildDeleteXML(masterId: string, voucherType: string, date: string) {
  const formattedDate = date.replace(/-/g, "");
  
  return `<ENVELOPE>
    <HEADER>
      <VERSION>1</VERSION>
      <TALLYREQUEST>Import</TALLYREQUEST>
      <TYPE>Data</TYPE>
      <ID>Vouchers</ID>
    </HEADER>
    <BODY>
      <DESC>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${COMPANY_NAME}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </DESC>
      <DATA>
        <TALLYMESSAGE>
          <VOUCHER DATE="${formattedDate}" TAGNAME="MASTER ID" TAGVALUE="${masterId}" ACTION="Delete" VCHTYPE="${voucherType}">
          </VOUCHER>
        </TALLYMESSAGE>
      </DATA>
    </BODY>
  </ENVELOPE>`;
}

// GET
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await findVoucherByGuid(id);
  if (!result.exists) return NextResponse.json({ error: "Voucher not found", guid: id }, { status: 404 });
  return NextResponse.json({ success: true, voucher: result });
}

// PUT
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const required = ["voucherType", "amount", "ledgerName", "date"] as const;
  const missing = required.filter(f => !body[f]);
  if (missing.length) return NextResponse.json({ error: "Missing fields", missing }, { status: 400 });

  const voucher = await findVoucherByGuid(id);
  if (!voucher.exists) return NextResponse.json({ error: "Voucher not found", guid: id }, { status: 404 });

  // Use the date from request or fall back to original voucher date
  const dateToUse = body.date || voucher.date.split('/').reverse().join('-');
  
  const xml = buildUpdateXML(body, voucher.masterId, voucher.voucherType, dateToUse);

  console.log("Sending UPDATE XML:", xml);

  try {
    const response = await axios.post(TALLY_BASE_URL, xml, { 
      headers: { "Content-Type": "application/xml" }, 
      timeout: 15000 
    });
    
    console.log("Tally UPDATE Response:", response.data);
    
    return NextResponse.json({ 
      success: true, 
      message: "Updated", 
      guid: id, 
      masterId: voucher.masterId 
    });
  } catch (err: any) {
    console.error("Update error:", err.response?.data || err.message);
    return NextResponse.json({ 
      error: "Update failed", 
      details: err.message,
      response: err.response?.data 
    }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const voucher = await findVoucherByGuid(id);
  if (!voucher.exists) return NextResponse.json({ error: "Voucher not found", guid: id }, { status: 404 });

  // Convert date from DD/MM/YYYY to YYYY-MM-DD format
  const dateToUse = voucher.date.split('/').reverse().join('-');
  
  const xml = buildDeleteXML(voucher.masterId, voucher.voucherType, dateToUse);

  console.log("Sending DELETE XML:", xml);

  try {
    const response = await axios.post(TALLY_BASE_URL, xml, { 
      headers: { "Content-Type": "application/xml" }, 
      timeout: 15000 
    });
    
    console.log("Tally DELETE Response:", response.data);
    
    return NextResponse.json({ 
      success: true, 
      message: "Deleted", 
      guid: id 
    });
  } catch (err: any) {
    console.error("Delete error:", err.response?.data || err.message);
    return NextResponse.json({ 
      error: "Delete failed", 
      details: err.message,
      response: err.response?.data 
    }, { status: 500 });
  }
}