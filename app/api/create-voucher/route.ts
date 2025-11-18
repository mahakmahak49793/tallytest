import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Tally XML request builder
function buildTallyXML(voucherData: any) {
  const {
    voucherType,
    voucherNumber,
    date,
    partyName,
    amount,
    narration,
    ledgerName,
  } = voucherData;

  // Format date to Tally format (YYYYMMDD)
  const formattedDate = date.replace(/-/g, "");
  
  // Format amount with 2 decimal places
  const formattedAmount = parseFloat(amount).toFixed(2);

  return `
    <ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>Vouchers</REPORTNAME>
            <STATICVARIABLES>
              <SVCURRENTCOMPANY>GennextIT</SVCURRENTCOMPANY>
            </STATICVARIABLES>
          </REQUESTDESC>
          <REQUESTDATA>
            <TALLYMESSAGE xmlns:UDF="TallyUDF">
              <VOUCHER REMOTEID="" VCHKEY="" VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
                <DATE>${formattedDate}</DATE>
                <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
                <VOUCHERNUMBER>${voucherNumber}</VOUCHERNUMBER>
                <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
                <NARRATION>${narration}</NARRATION>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>${partyName}</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                  <AMOUNT>${formattedAmount}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
                <ALLLEDGERENTRIES.LIST>
                  <LEDGERNAME>${ledgerName}</LEDGERNAME>
                  <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                  <AMOUNT>-${formattedAmount}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>
              </VOUCHER>
            </TALLYMESSAGE>
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "voucherType",
      "voucherNumber",
      "date",
      "partyName",
      "amount",
      "ledgerName",
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate amount is a valid number
    if (isNaN(parseFloat(body.amount))) {
      return NextResponse.json(
        { error: "Amount must be a valid number" },
        { status: 400 }
      );
    }

    // Build Tally XML request
    const tallyXML = buildTallyXML(body);

    const TALLY_BASE_URL = process.env.TALLY_URL || "http://localhost:9000";

    console.log("Sending request to Tally:", TALLY_BASE_URL);
    console.log("XML Request:", tallyXML);

    // Send request to Tally
    const response = await axios.post(
      TALLY_BASE_URL,
      tallyXML,
      {
        headers: {
          "Content-Type": "application/xml",
          "Accept": "application/xml",
        },
        timeout: 10000,
      }
    );

    console.log("Tally Response:", response.data);

    // Parse the response
    return parseTallyResponse(response.data, body);
  } catch (error: any) {
    console.error("Error creating Tally voucher:", error);

    if (error.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          error:
            "Cannot connect to Tally. Please ensure Tally is running with XML capabilities enabled on port 9000.",
        },
        { status: 503 }
      );
    }

    if (error.response) {
      console.error("Tally error response:", error.response.data);
      return NextResponse.json(
        {
          error: `Tally responded with error: ${error.response.status}`,
          details: error.response.data,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create voucher in Tally" },
      { status: 500 }
    );
  }
}

function parseTallyResponse(responseData: string, formData: any) {
  console.log("Raw Tally Response:", responseData);
  
  // Check for success indicators in Tally response
  if (responseData.includes("CREATED") || 
      responseData.includes("SUCCESS") || 
      responseData.includes("<CREATED>1</CREATED>")) {
    return NextResponse.json(
      {
        success: true,
        message: `Voucher ${formData.voucherNumber} created successfully in Tally`,
        voucherNumber: formData.voucherNumber,
      },
      { status: 200 }
    );
  } else if (
    responseData.includes("ERROR") ||
    responseData.includes("FAILED") ||
    responseData.includes("<LINEERROR>")
  ) {
    return NextResponse.json(
      { 
        error: "Tally returned an error. Please check the voucher details.",
        details: responseData 
      },
      { status: 400 }
    );
  } else {
    // If we can't determine the response, return it for debugging
    return NextResponse.json(
      {
        success: true,
        message: "Voucher sent to Tally. Please verify in Tally application.",
        note: "Response format not recognized",
        response: responseData,
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: "active",
      message: "Tally Voucher API is running",
      endpoints: {
        createVoucher: "POST /api/create-voucher",
      },
    },
    { status: 200 }
  );
}