/* eslint-disable @typescript-eslint/no-explicit-any */
// /api/customers/[name]/route.ts
import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

const TALLY_URL = process.env.TALLY_URL ?? "http://localhost:9000";

function buildXML(company?: string) {
  return `
  <ENVELOPE>
    <HEADER>
      <VERSION>1</VERSION>
      <TALLYREQUEST>Export</TALLYREQUEST>
      <TYPE>Collection</TYPE>
      <ID>CustomerCollection</ID>
    </HEADER>
    <BODY>
      <DESC>
        <STATICVARIABLES>
          ${company ? `<SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY>` : ""}
        </STATICVARIABLES>
        <TDL>
          <TDLMESSAGE>
            <COLLECTION NAME="CustomerCollection">
              <TYPE>Ledger</TYPE>
              <CHILDOF>Sundry Debtors</CHILDOF>
              <FETCH>
                NAME,
                MAILINGNAME,
                ADDRESS,
                PHONENUMBER,
                MOBILENUMBER,
                EMAIL,
                GSTIN,
                OPENINGBALANCE,
                OPENINGBALANCETYPE
              </FETCH>
            </COLLECTION>
          </TDLMESSAGE>
        </TDL>
      </DESC>
    </BODY>
  </ENVELOPE>
  `;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    
    const url = new URL(req.url);
    const companyName = url.searchParams.get("company") || undefined;

    const xmlRequest = buildXML(companyName);

    const tallyResponse = await fetch(TALLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlRequest,
    });

    const xml = await tallyResponse.text();
    
    // Log raw XML to see structure
    console.log("Raw XML response:", xml.substring(0, 1000));
    
    const json = await parseStringPromise(xml, { explicitArray: false });

    // Log parsed JSON structure
    console.log("Parsed JSON:", JSON.stringify(json, null, 2).substring(0, 2000));

    const ledgers =
      json?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER ||
      json?.ENVELOPE?.BODY?.COLLECTION?.LEDGER ||
      [];

    const list = Array.isArray(ledgers) ? ledgers : [ledgers];

    // Log first ledger to see its structure
    console.log("First ledger structure:", JSON.stringify(list[0], null, 2));

    const searchName = decodeURIComponent(name).trim().toLowerCase();
    
    console.log("Searching for:", searchName);

    const found = list.find(
      (l) => {
        // Check both l.NAME and l.$?.NAME (attribute vs element)
        const ledgerName = String(l.NAME || l.$?.NAME || l._.NAME || "").trim().toLowerCase();
        console.log(`Comparing "${ledgerName}" with "${searchName}"`, l);
        return ledgerName === searchName;
      }
    );
    console.log("All available fields:", Object.keys(found));

    if (!found) {
      return NextResponse.json({ 
        error: "Customer not found",
        searchedFor: searchName,
        availableCustomers: list.map(l => l.NAME || l.$?.NAME || "unknown")
      }, { status: 404 });
    }

    console.log("Found customer:", found);

    // Get name from wherever it is
    const customerName = found.NAME || found.$?.NAME || null;

   const phone = found.LEDGERPHONE || null;
const mobile = found.LEDGERMOBILE || null;
const gstin = found.PARTYGSTIN || null;

    const email = found.EMAIL?._ || found["EMAIL.LIST"]?.EMAIL || found.EMAIL || null;

    const address = typeof found.ADDRESS === "string"
      ? found.ADDRESS
      : found["ADDRESS.LIST"]?.ADDRESS || null;

    const mailingName = found["MAILINGNAME.LIST"]?.MAILINGNAME || found.MAILINGNAME || null;

    return NextResponse.json({
      customer: {
        name: customerName,
        mailingName: mailingName,
        address: address,
        phone: phone,
        mobile: mobile,
        email: email,
        gstin: found.PARTYGSTIN ?? null,
        openingBalance: found.OPENINGBALANCE?._ ?? found.OPENINGBALANCE ?? null,
        openingBalanceType: found.OPENINGBALANCE?.$?.TYPE ?? null,
        raw: found
      }
    });

  } catch (err: any) {
    console.error("Error fetching customer:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer", details: err.message },
      { status: 500 }
    );
  }
}