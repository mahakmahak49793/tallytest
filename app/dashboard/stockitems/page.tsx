"use client";

import { useEffect, useState } from "react";

export default function StockItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStockItems = async () => {
    try {
      const res = await fetch("/api/stockitems");
      const data = await res.json();

      if (data.success) {
        setItems(data.data);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStockItems();
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        Stock Items from Tally
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ccc",
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Name</th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>
                Closing Balance
              </th>
              <th style={{ padding: "10px", border: "1px solid #ccc" }}>Unit</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item: any, index: number) => (
              <tr key={index}>
                <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                  {item.name}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                  {item.closingBalance}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ccc" }}>
                  {item.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
