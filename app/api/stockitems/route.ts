// app/api/stockitems/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

const TALLY_URL = "http://localhost:9000";

export async function GET() {
  try {
    // === STEP 1: GET ALL COMPANIES ===
    const companyXML = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>AllCompanies</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllCompanies" ISMODIFY="No">
            <TYPE>Company</TYPE>
            <NATIVEMETHOD>*</NATIVEMETHOD>
            <FETCH>Name</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

    const compRes = await fetch(TALLY_URL, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: companyXML,
    });

    if (!compRes.ok) throw new Error(`Tally error: ${compRes.status}`);
    const compXml = await compRes.text();

    const companies: string[] = [];
    const regex = /<NAME>(.*?)<\/NAME>/gi;
    let match;
    while ((match = regex.exec(compXml)) !== null) {
      const name = match[1].trim();
      if (name && name !== "All Companies") companies.push(name);
    }

    if (companies.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No companies found.",
        fix: "Restart Tally → Select GennextIT → Wait 10 sec",
      });
    }

    // === STEP 2: TRY EACH COMPANY ===
    for (const name of companies) {
      console.log(`Trying: ${name}`);

      const stockXML = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>StockItems</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVCURRENTCOMPANY>${name}</SVCURRENTCOMPANY>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="StockItems" ISMODIFY="No">
            <TYPE>Stock Item</TYPE>
            <FETCHLIST>
              <FETCH>Name</FETCH>
              <FETCH>BaseUnits</FETCH>
              <FETCH>ClosingBalance</FETCH>
              <FETCH>ClosingValue</FETCH>
            </FETCHLIST>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

      try {
        const stockRes = await fetch(TALLY_URL, {
          method: "POST",
          headers: { "Content-Type": "text/xml" },
          body: stockXML,
        });

        const stockXml = await stockRes.text();

        if (stockXml.includes("<STOCKITEM")) {
          console.log(`SUCCESS with ${name}`);

          const json = await parseStringPromise(stockXml, {
            explicitArray: false,
            ignoreAttrs: true,
            trim: true,
          });

          const items = json?.ENVELOPE?.COLLECTION?.STOCKITEM;
          const list = Array.isArray(items) ? items : items ? [items] : [];

          const data = list.map((i: any) => ({
            name: i.NAME || "Unknown",
            unit: i.BASEUNITS || "N/A",
            closingBalance: i.CLOSINGBALANCE || "0",
            closingValue: i.CLOSINGVALUE || "0",
          }));

          return NextResponse.json({
            success: true,
            data,
            company: name,
            count: data.length,
          });
        }
      } catch (e) {
        console.log(`Failed: ${name}`, (e as any).message);
      }
    }

    return NextResponse.json({
      success: true,
      data: [],
      company: companies[0],
      message: "No stock items found. Create 'Laptop' in Tally.",
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      fix: "Restart Tally → Select GennextIT → Wait 10 sec",
    }, { status: 500 });
  }
}