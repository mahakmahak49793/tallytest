"use client";

import { useState } from "react";

export default function StockItemsPage() {
  const [company, setCompany] = useState("MyCompany");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState("");

  async function fetchStockItems() {
    setLoading(true);

    const res = await fetch(`/api/stockitems?company=${company}`);
    const data = await res.json();

    setLoading(false);

    if (data.success) {
      setItems(data.items);
      setRaw(data.rawXML);
    } else {
      alert("Error: " + data.error);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Stock Items from Tally</h1>

      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Enter Company Name"
        style={{ padding: "8px", width: "250px", marginRight: "10px" }}
      />

      <button
        onClick={fetchStockItems}
        style={{ padding: "8px 15px", cursor: "pointer" }}
      >
        Fetch Items
      </button>

      {loading && <p>Loading...</p>}

      <h2 style={{ marginTop: "20px" }}>Stock Items:</h2>
      <ul>
        {items.map((item: any, index) => (
          <li key={index}>
            {item?.STOCKITEM?.$.NAME ||
              item?.STOCKITEM?.NAME ||
              "Unnamed Item"}
          </li>
        ))}
      </ul>

      <h3>Raw XML Response (Debug)</h3>
      <pre
        style={{
          background: "#222",
          color: "#0f0",
          padding: "10px",
          fontSize: "12px",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        {raw}
      </pre>
    </div>
  );
}
