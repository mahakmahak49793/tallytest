/* eslint-disable @typescript-eslint/no-explicit-any */
// /api/customers/[name]/route.ts
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

function buildUpdateXML(name: string, customerData: any, company?: string) {
  const {
    mailingName,
    address,
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
          <LEDGER NAME="${name}" ACTION="Alter">
            <NAME>${name}</NAME>
            <PARENT>Sundry Debtors</PARENT>

            ${mailingName !== undefined && mailingName !== "" ? `<MAILINGNAME>${mailingName}</MAILINGNAME>` : ""}

            ${address !== undefined && address !== "" ? `
            <ADDRESS>${address}</ADDRESS>` : ""}

            ${email !== undefined && email !== "" ? `<EMAIL>${email}</EMAIL>` : ""}

            ${phone !== undefined && phone !== "" ? `
            <PHONENUMBER.LIST>
              <PHONENUMBER>${phone}</PHONENUMBER>
              <ISCONTACTPERSON>No</ISCONTACTPERSON>
            </PHONENUMBER.LIST>` : ""}

            ${mobile !== undefined && mobile !== "" ? `
            <CONTACT.LIST>
              <PERSONNAME>${mailingName || name}</PERSONNAME>
              <MOBILENUMBER>${mobile}</MOBILENUMBER>
              <ISCONTACTPERSON>Yes</ISCONTACTPERSON>
            </CONTACT.LIST>` : ""}

            ${gstin !== undefined && gstin !== "" ? `
            <GSTDETAILS.LIST>
              <APPLICABLEFROM>19700101</APPLICABLEFROM>
              <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
              <GSTIN>${gstin}</GSTIN>
            </GSTDETAILS.LIST>` : ""}

            ${openingBalance !== undefined ? `
            <OPENINGBALANCE>${openingBalance}</OPENINGBALANCE>` : ""}

            <ISBILLWISEON>Yes</ISBILLWISEON>
            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>

          </LEDGER>
        </TALLYMESSAGE>
      </DATA>
    </BODY>
  </ENVELOPE>
  `;
}

function buildDeleteXML(name: string, company?: string) {
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
          <LEDGER NAME="${name}" ACTION="Delete">
            <NAME>${name}</NAME>
          </LEDGER>
        </TALLYMESSAGE>
      </DATA>
    </BODY>
  </ENVELOPE>
  `;
}

// GET - Read single customer
export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    
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
      [];

    const list = Array.isArray(ledgers) ? ledgers : [ledgers];

    const searchName = decodeURIComponent(name).trim().toLowerCase();

    const found = list.find(
      (l) => {
        const ledgerName = String(l.NAME || l.$?.NAME || l._.NAME || "").trim().toLowerCase();
        return ledgerName === searchName;
      }
    );

    if (!found) {
      return NextResponse.json({ 
        error: "Customer not found",
        searchedFor: searchName,
        availableCustomers: list.map(l => l.NAME || l.$?.NAME || "unknown")
      }, { status: 404 });
    }

    const customerName = found.NAME || found.$?.NAME || null;

    const phoneList = found["PHONENUMBER.LIST"]?.PHONENUMBER || found.PHONENUMBER;
    const mobileList = found["MOBILENUMBER.LIST"]?.MOBILENUMBER || found.MOBILENUMBER;

    const phone = Array.isArray(phoneList) 
      ? phoneList.join(", ") 
      : phoneList || null;

    const mobile = Array.isArray(mobileList) 
      ? mobileList.join(", ") 
      : mobileList || null;

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
        gstin: found.GSTIN ?? null,
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

// PUT - Update customer
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const url = new URL(req.url);
    const companyName = url.searchParams.get("company") || undefined;
    
    const body = await req.json();
    
    const xmlRequest = buildUpdateXML(decodeURIComponent(name), body, companyName);
    
    console.log("Updating customer with XML:", xmlRequest);

    const tallyResponse = await fetch(TALLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlRequest,
    });

    const xml = await tallyResponse.text();
    console.log("Tally response:", xml);

    if (xml.includes("ALTERED") || xml.includes("Import")) {
      return NextResponse.json({
        success: true,
        message: "Customer updated successfully",
        customerName: name
      });
    } else if (xml.includes("Error") || xml.includes("ERROR")) {
      return NextResponse.json(
        { error: "Tally returned an error", details: xml },
        { status: 400 }
      );
    } else {
      return NextResponse.json({
        success: true,
        message: "Customer update request sent",
        customerName: name
      });
    }

  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const url = new URL(req.url);
    const companyName = url.searchParams.get("company") || undefined;
    
    const xmlRequest = buildDeleteXML(decodeURIComponent(name), companyName);
    
    console.log("Deleting customer with XML:", xmlRequest);

    const tallyResponse = await fetch(TALLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlRequest,
    });

    const xml = await tallyResponse.text();
    console.log("Tally response:", xml);

    if (xml.includes("DELETED") || xml.includes("Import")) {
      return NextResponse.json({
        success: true,
        message: "Customer deleted successfully",
        customerName: name
      });
    } else if (xml.includes("Error") || xml.includes("ERROR")) {
      return NextResponse.json(
        { error: "Tally returned an error", details: xml },
        { status: 400 }
      );
    } else {
      return NextResponse.json({
        success: true,
        message: "Customer deletion request sent",
        customerName: name
      });
    }

  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer", details: error.message },
      { status: 500 }
    );
  }
}