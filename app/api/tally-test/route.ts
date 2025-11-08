import axios from "axios";
import xml2js from "xml2js";

export async function GET() {
  const tallyURL = "http://localhost:9000/";

  const testXML = `
  <ENVELOPE>
      <HEADER>
          <TALLYREQUEST>Export Data</TALLYREQUEST>
      </HEADER>
      <BODY>
          <EXPORTDATA>
              <REQUESTDESC>
                  <REPORTNAME>List of Companies</REPORTNAME>
                  <STATICVARIABLES>
                      <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                  </STATICVARIABLES>
              </REQUESTDESC>
          </EXPORTDATA>
      </BODY>
  </ENVELOPE>
  `;

  try {
    const response = await axios.post(tallyURL, testXML, {
      headers: { "Content-Type": "text/xml" },
    });

    const result = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
    });

    return Response.json({
      success: true,
      message: "Connection Successful",
      data: result,
    });
  } catch (error:any) {
    return Response.json({
      success: false,
      message: "Connection Failed",
      error: error.message,
    });
  }
}
