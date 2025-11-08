"use client";
import React, { useEffect, useState } from "react";

interface Ledger {
  name?: string;
  parent?: string;
  openingBalance?: string | number;
  raw?: {
    NAME?: string;
    PARENT?: string;
    [key: string]: any;
  };
}

interface LedgerListProps {
  initialCompany?: string;
}

export default function LedgerList({ initialCompany = "" }: LedgerListProps) {
  const [company, setCompany] = useState<string>(initialCompany);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  async function fetchLedgers(selectedCompany: string) {
    setLoading(true);
    setError(null);
    try {
      const q = selectedCompany
        ? `?company=${encodeURIComponent(selectedCompany)}`
        : "";
      const res = await fetch(`/api/ledgers${q}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load");
      }

      setLedgers(data.ledgers || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCompany) {
      fetchLedgers(initialCompany);
    }
  }, [initialCompany]);

  const handleFetchClick = () => {
    if (company.trim()) {
      fetchLedgers(company);
    } else {
      setError("Please enter a company name");
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany(e.target.value);
    setError(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFetchClick();
    }
  };

  // Filter ledgers based on search term
  const filteredLedgers = ledgers.filter((ledger) => {
    const name = ledger.name || (ledger.raw && ledger.raw.NAME) || "";
    const parent = ledger.parent || (ledger.raw && ledger.raw.PARENT) || "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group ledgers by parent for better organization
  const groupedLedgers = filteredLedgers.reduce((acc, ledger) => {
    const parent =
      ledger.parent || (ledger.raw && ledger.raw.PARENT) || "Ungrouped";
    if (!acc[parent]) {
      acc[parent] = [];
    }
    acc[parent].push(ledger);
    return acc;
  }, {} as Record<string, Ledger[]>);

  const totalBalance = filteredLedgers.reduce((sum, ledger) => {
    const balance =
      typeof ledger.openingBalance === "number"
        ? ledger.openingBalance
        : parseFloat(ledger.openingBalance as string) || 0;
    return sum + balance;
  }, 0);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header Section */}
      <div className="bg-blue-600 text-white p-8 rounded-xl mb-8 shadow-md">
  <h1 className="text-2xl font-semibold m-0">📊 Ledger Management</h1>
  <p className="mt-2 opacity-90 text-base">
    View and manage your company ledgers
  </p>
</div>


      {/* Controls Section */}
      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "300px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Company Name
            </label>
            <input
              placeholder="Enter company name..."
              value={company}
              onChange={handleCompanyChange}
              onKeyPress={handleKeyPress}
              style={{
                padding: "12px 16px",
                width: "100%",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <button
            onClick={handleFetchClick}
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: loading ? "#9ca3af" : "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              minWidth: "140px",
            }}
            onMouseOver={(e) =>
              !loading && (e.currentTarget.style.background = "#5a6fd8")
            }
            onMouseOut={(e) =>
              !loading && (e.currentTarget.style.background = "#667eea")
            }
          >
            {loading ? (
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid transparent",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Loading...
              </span>
            ) : (
              "Fetch Ledgers"
            )}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {!loading && !error && (ledgers.length > 0 || searchTerm) && (
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
            marginBottom: "24px",
          }}
        >
          {/* Stats and Search */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: "#374151", fontSize: "18px" }}>
                {filteredLedgers.length} of {ledgers.length} Ledgers
                {searchTerm && ` matching "${searchTerm}"`}
              </h3>
              {totalBalance !== 0 && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Total Opening Balance:{" "}
                  <strong style={{ color: "#059669" }}>
                    ₹{totalBalance.toLocaleString()}
                  </strong>
                </p>
              )}
            </div>

            <div style={{ minWidth: "250px" }}>
              <input
                placeholder="Search ledgers..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{
                  padding: "10px 16px",
                  width: "100%",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          {/* Ledgers Table */}
          {Object.keys(groupedLedgers).length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      #
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      Ledger Name
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      Parent Group
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#374151",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      Opening Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedLedgers).map(
                    ([parent, parentLedgers]) => (
                      <React.Fragment key={parent}>
                        <tr style={{ background: "#f0f4ff" }}>
                          <td
                            colSpan={4}
                            style={{
                              padding: "8px 16px",
                              fontWeight: "600",
                              color: "#667eea",
                              fontSize: "13px",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            📁 {parent}
                          </td>
                        </tr>
                        {parentLedgers.map((ledger, index) => (
                          <tr
                            key={index}
                            style={{
                              borderBottom: "1px solid #f3f4f6",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#f9fafb")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <td
                              style={{ padding: "12px 16px", color: "#6b7280" }}
                            >
                              {index + 1}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                fontWeight: "500",
                              }}
                            >
                              {ledger.name ||
                                (ledger.raw && ledger.raw.NAME) ||
                                "—"}
                            </td>
                            <td
                              style={{ padding: "12px 16px", color: "#6b7280" }}
                            >
                              {ledger.parent ||
                                (ledger.raw && ledger.raw.PARENT) ||
                                "—"}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "right",
                                fontWeight: "500",
                                color:
                                  ledger.openingBalance &&
                                  parseFloat(ledger.openingBalance as string) >=
                                    0
                                    ? "#059669"
                                    : "#dc2626",
                              }}
                            >
                              {ledger.openingBalance
                                ? `₹${parseFloat(
                                    ledger.openingBalance as string
                                  ).toLocaleString()}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#6b7280",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
              <h3 style={{ margin: "0 0 8px 0" }}>No matching ledgers found</h3>
              <p>Try adjusting your search terms</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && ledgers.length === 0 && company && (
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📋</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>
            No Ledgers Found
          </h3>
          <p style={{ color: "#6b7280", margin: 0 }}>
            No ledgers were found for company "{company}". Make sure the company
            exists and has ledgers in Tally.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!loading && !error && ledgers.length === 0 && !company && (
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏢</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>
            Ready to Explore Ledgers
          </h3>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Enter a company name above to fetch and view its ledgers
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
