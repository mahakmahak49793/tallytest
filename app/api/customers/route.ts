// /api/customers/route.ts
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
                NAME,MAILINGNAME,ADDRESS,PHONENUMBER,GSTIN,OPENINGBALANCE,OPENINGBALANCETYPE
              </FETCH>
            </COLLECTION>
          </TDLMESSAGE>
        </TDL>
      </DESC>
    </BODY>
  </ENVELOPE>
  `;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const companyName = url.searchParams.get("company") || undefined;

    const xmlRequest = buildXML(companyName);

    const tallyResponse = await fetch(TALLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlRequest,
    });

    const xml = await tallyResponse.text();

    const json = await parseStringPromise(xml, { explicitArray: false });

    const ledgers =
      json?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER ||
      json?.ENVELOPE?.BODY?.COLLECTION?.LEDGER ||
      [];

    const list = Array.isArray(ledgers) ? ledgers : [ledgers];

    const customers = list.map((l) => ({
      name: l.$?.NAME ?? null, // FIXED
      mailingName:
        l["MAILINGNAME.LIST"]?.MAILINGNAME ??
        l.MAILINGNAME ??
        null,
      address:
        typeof l.ADDRESS === "string"
          ? l.ADDRESS
          : l["ADDRESS.LIST"]?.ADDRESS ?? null,
      phone: l.PHONENUMBER ?? l.PHONE ?? null,
      gstin: l.GSTIN ?? l.GSTREGISTRATIONNUMBER ?? null,
      openingBalance: l.OPENINGBALANCE?._ ?? l.OPENINGBALANCE ?? null,
      openingBalanceType: l.OPENINGBALANCE?.$?.TYPE ?? null,
      raw: l,
    }));

    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch customers", details: error.message },
      { status: 500 }
    );
  }
}
