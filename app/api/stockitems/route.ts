import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

const TALLY_URL = "http://localhost:9000";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company") || "";

    const xml = `
      <ENVELOPE>
        <HEADER>
          <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
          <EXPORTDATA>
            <REQUESTDESC>
              <REPORTNAME>List of Accounts</REPORTNAME>
              <STATICVARIABLES>
                <ACCOUNTTYPE>Stock Item</ACCOUNTTYPE>
                <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
                <SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY>
              </STATICVARIABLES>
            </REQUESTDESC>
          </EXPORTDATA>
        </BODY>
      </ENVELOPE>
    `;

    const res = await fetch(TALLY_URL, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: xml,
    });

    const xmlData = await res.text();

    const json = await parseStringPromise(xmlData, {
      explicitArray: false,
    });

    const items = json?.ENVELOPE?.BODY?.EXPORTDATA?.TALLYMESSAGE || [];

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
      rawSample: xmlData,
      method: "List of Accounts + ACCOUNTTYPE=Stock Item"
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: String(e),
    });
  }
}
