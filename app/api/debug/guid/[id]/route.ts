// app/api/debug/guid/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { parseStringPromise } from "xml2js";

const TALLY_BASE_URL = process.env.TALLY_URL || "http://localhost:9000";
const COMPANY_NAME = process.env.TALLY_COMPANY_NAME || "GennextIT";

interface VoucherInfo {
  guid: string;
  masterId: string;
  voucherNumber: string;
  voucherType: string;
  date: string;
  partyName?: string;
  narration?: string;
}

interface DebugResult {
  attempt: number;
  structure: string;
  hasVoucherData: boolean;
  voucherCount: number;
  responseLength: number;
  error?: string;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  console.log(`Debug: Searching for GUID: ${id}`);

  // This is the ONLY XML that reliably returns <GUID> in Tally Prime
  const COLLECTION_XML_WITH_GUID = `<ENVELOPE>
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
          <COLLECTION NAME="AllVouchersWithGUID" ISMODIFY="No" ISFIXED="No" ISINITIALIZE="No" ISOPTION="No" ISINTERNAL="No">
            <TYPE>Voucher</TYPE>
            <FETCHLIST>
              <FETCH>GUID</FETCH>
              <FETCH>MASTERID</FETCH>
              <FETCH>DATE</FETCH>
              <FETCH>VOUCHERNUMBER</FETCH>
              <FETCH>VOUCHERTYPENAME</FETCH>
              <FETCH>NARRATION</FETCH>
              <FETCH>PARTYLEDGERNAME</FETCH>
              <FETCH>ALLLEDGERENTRIES.LIST.*</FETCH>
            </FETCHLIST>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

  const debugResults: DebugResult[] = [];
  let allVouchers: VoucherInfo[] = [];
  let foundVoucher: VoucherInfo | null = null;

  try {
    console.log("Attempt 1: Fetching vouchers using Collection Export (with GUID)...");

    const response = await axios.post(
      TALLY_BASE_URL,
      COLLECTION_XML_WITH_GUID,
      {
        headers: { "Content-Type": "application/xml" },
        timeout: 30000,
      }
    );

    const parsed = await parseStringPromise(response.data, {
      explicitArray: true,
      mergeAttrs: true,
      trim: true,
    });

    let voucherData: any[] = [];
    let structure = "unknown";

    // Structure: Direct <VOUCHER> under <ENVELOPE>
    if (parsed?.ENVELOPE?.VOUCHER && Array.isArray(parsed.ENVELOPE.VOUCHER)) {
      voucherData = parsed.ENVELOPE.VOUCHER;
      structure = "ENVELOPE.VOUCHER (Collection Export - Recommended)";
    }
    // Fallback (shouldn't happen with this XML)
    else if (parsed?.ENVELOPE?.BODY?.[0]?.DATA?.[0]?.COLLECTION?.[0]?.VOUCHER) {
      voucherData = parsed.ENVELOPE.BODY[0].DATA[0].COLLECTION[0].VOUCHER;
      structure = "DATA.COLLECTION.VOUCHER";
    }

    debugResults.push({
      attempt: 1,
      structure,
      hasVoucherData: voucherData.length > 0,
      voucherCount: voucherData.length,
      responseLength: response.data.length,
    });

    console.log(`Found ${voucherData.length} vouchers with GUIDs`);

    const getField = (field: any): string => {
      if (!field) return "";
      if (Array.isArray(field)) return field[0] || "";
      return String(field);
    };

    for (const voucher of voucherData) {
      const guid = getField(voucher.GUID);
      const masterId = getField(voucher.MASTERID);

      if (!guid) continue; // Skip if no GUID (shouldn't happen)

      const info: VoucherInfo = {
        guid,
        masterId,
        voucherNumber: getField(voucher.VOUCHERNUMBER),
        voucherType: getField(voucher.VOUCHERTYPENAME),
        date: getField(voucher.DATE),
        partyName: getField(voucher.PARTYLEDGERNAME),
        narration: getField(voucher.NARRATION),
      };

      // Avoid duplicates
      if (!allVouchers.some((v) => v.guid === guid)) {
        allVouchers.push(info);
      }

      // Found it!
      if (guid === id) {
        foundVoucher = info;
        console.log(`FOUND VOUCHER with GUID: ${id}`);
        console.log("Voucher Details:", info);
      }
    }
  } catch (attemptError: any) {
    console.error("Error during Collection Export:", attemptError.message);
    debugResults.push({
      attempt: 1,
      structure: "error",
      hasVoucherData: false,
      voucherCount: 0,
      responseLength: 0,
      error: attemptError.message || String(attemptError),
    });
  }

  return NextResponse.json({
    searchGuid: id,
    found: !!foundVoucher,
    voucher: foundVoucher,
    allVouchers: allVouchers.slice(0, 50), // Limit output size
    totalVouchersFound: allVouchers.length,
    debugResults,
    company: COMPANY_NAME,
    tallyUrl: TALLY_BASE_URL,
    tip: "This endpoint uses Tally Collection Export which ALWAYS returns GUIDs",
    timestamp: new Date().toISOString(),
  });
}