/* eslint-disable @typescript-eslint/no-explicit-any */
// /api/customers/route.ts
import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

const TALLY_URL = process.env.TALLY_URL ?? "http://localhost:9000";

function buildFetchXML(company?: string) {
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
                NAME,MAILINGNAME,ADDRESS,PHONENUMBER,MOBILENUMBER,EMAIL,GSTIN,OPENINGBALANCE,OPENINGBALANCETYPE
              </FETCH>
            </COLLECTION>
          </TDLMESSAGE>
        </TDL>
      </DESC>
    </BODY>
  </ENVELOPE>
  `;
}

function buildCreateXML(customerData: any, company?: string) {
  const {
    name,
    mailingName,
    address,
    state,
    country,
    phone,
    mobile,
    email,
    gstin,
    openingBalance
  } = customerData;

  return `
  <ENVELOPE>
    <HEADER>
      <VERSION>1</VERSION>
      <TALLYREQUEST>Import</TALLYREQUEST>
      <TYPE>Data</TYPE>
      <ID>All Masters</ID>
    </HEADER>
    <BODY>
      <DESC>
        <STATICVARIABLES>
          ${company ? `<SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY>` : ""}
        </STATICVARIABLES>
      </DESC>
      <DATA>
        <TALLYMESSAGE>
          <LEDGER NAME="${name}" ACTION="Create">
            <NAME>${name}</NAME>
            <PARENT>Sundry Debtors</PARENT>

            ${mailingName ? `<MAILINGNAME>${mailingName}</MAILINGNAME>` : ""}

            ${
              address
                ? `
            <ADDRESS.LIST>
              <ADDRESS>${address}</ADDRESS>
            </ADDRESS.LIST>`
                : ""
            }

            ${state ? `<STATENAME>${state}</STATENAME>` : ""}
            ${country ? `<COUNTRYNAME>${country}</COUNTRYNAME>` : ""}

            ${phone ? `<LEDGERPHONE>${phone}</LEDGERPHONE>` : ""}
            ${mobile ? `<LEDGERMOBILE>${mobile}</LEDGERMOBILE>` : ""}
            ${email ? `<EMAIL>${email}</EMAIL>` : ""}
            ${gstin ? `<PARTYGSTIN>${gstin}</PARTYGSTIN>` : ""}

            ${
              openingBalance
                ? `<OPENINGBALANCE>${openingBalance}</OPENINGBALANCE>`
                : ""
            }

            <ISBILLWISEON>Yes</ISBILLWISEON>
            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>

          </LEDGER>
        </TALLYMESSAGE>
      </DATA>
    </BODY>
  </ENVELOPE>
  `;
}


export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const companyName = url.searchParams.get("company") || undefined;

    const xmlRequest = buildFetchXML(companyName);

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
      [];w

    const list = Array.isArray(ledgers) ? ledgers : [ledgers];

    const customers = list.map((l) => ({
      name: l.$?.NAME ?? l.NAME ?? null,
      mailingName: l["MAILINGNAME.LIST"]?.MAILINGNAME ?? l.MAILINGNAME ?? null,
      address: typeof l.ADDRESS === "string" ? l.ADDRESS : l["ADDRESS.LIST"]?.ADDRESS ?? null,
      phone: l.PHONENUMBER ?? l.PHONE ?? null,
      mobile: l.MOBILENUMBER ?? null,
      email: l.EMAIL?._ ?? l.EMAIL ?? null,
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

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const companyName = url.searchParams.get("company") || undefined;
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    const xmlRequest = buildCreateXML(body, companyName);
    
    console.log("Creating customer with XML:", xmlRequest);

    const tallyResponse = await fetch(TALLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlRequest,
    });

    const xml = await tallyResponse.text();
    console.log("Tally response:", xml);

    // Check if the response indicates success
    if (xml.includes("CREATED") || xml.includes("Import")) {
      return NextResponse.json({
        success: true,
        message: "Customer created successfully",
        customerName: body.name
      });
    } else if (xml.includes("Error") || xml.includes("ERROR")) {
      return NextResponse.json(
        { error: "Tally returned an error", details: xml },
        { status: 400 }
      );
    } else {
      return NextResponse.json({
        success: true,
        message: "Customer creation request sent",
        customerName: body.name
      });
    }

  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer", details: error.message },
      { status: 500 }
    );
  }
}