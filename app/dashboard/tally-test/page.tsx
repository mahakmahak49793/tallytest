"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TallyTestPage() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResponse(null);
    setShowCompanies(false);
    try {
      const res = await fetch("/api/tally-test");
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ success: false, error: "Failed to fetch" });
    } finally {
      setLoading(false);
    }
  };

  const handleShowCompanies = () => {
    setShowCompanies(!showCompanies);
  };

  const getStatusColor = () => {
    if (!response) return "bg-gray-100 border-gray-200";
    return response.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
  };

  const getStatusIcon = () => {
    if (!response) return "🔍";
    return response.success ? "✅" : "❌";
  };

  const getStatusText = () => {
    if (!response) return "Ready to test";
    return response.success ? "Connection Successful" : "Connection Failed";
  };

  // Extract company name from the response
  const getCompanyName = () => {
    if (!response || !response.success) return null;
    
    // Try different possible locations for company name in the response
    return (
      response.company ||
      response.data?.company ||
      response.data?.COMPANY?.NAME ||
      response.data?.ENVELOPE?.BODY?.DATA?.COMPANY?.NAME ||
      "Current Company"
    );
  };

  
  const router = useRouter();

  const handleLedgers = () => {
    router.push("/tally-ledgers");
  };
  const companyName = getCompanyName();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔗</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Tally Connection Test</h1>
              <p className="text-gray-600">Test connectivity with your Tally server</p>
            </div>
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
            } text-white flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <span>🚀</span>
                Test Tally Connection
              </>
            )}
          </button>
        </div>

        {/* Connection Status */}
        {response && (
          <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${getStatusColor()} transition-all duration-300 mb-6`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{getStatusIcon()}</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{getStatusText()}</h2>
                <p className="text-sm text-gray-600">
                  {response.success 
                    ? "Tally is properly connected and responding" 
                    : "Unable to establish connection with Tally"
                  }
                </p>
              </div>
            </div>

            {/* Show Company Info only when connection is successful */}
            {response.success && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Detected Company:</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {companyName || "No company name found"}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleShowCompanies}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      showCompanies
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white flex items-center gap-2 shadow-md hover:shadow-lg`}
                  >
                    {showCompanies ? (
                      <>
                        <span>👁️</span>
                        Hide Details
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        Show Details
                      </>
                    )}
                  </button>
                  <button onClick={handleLedgers} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Show Ledgers</button>
                </div>

                {/* Full Response Details */}
                {showCompanies && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Full Response:</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        RAW DATA
                      </span>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {!response && !loading && (
          <div className="text-center text-gray-500 text-sm mt-6">
            <p>Click the button above to test connection with Tally on localhost:9000</p>
          </div>
        )}
      </div>
    </div>
  );
}