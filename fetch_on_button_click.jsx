import { useState, useEffect, useMemo } from "react";

function Dashboard() {
  const [data, setData] = useState([]);
  const [statusData, setStatusData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sortOrder, setSortOrder] = useState("asc");
  const [filterText, setFilterText] = useState("");

  // ---------------------------------
  // 1️⃣ Fetch main data ON BUTTON CLICK
  // ---------------------------------
  const fetchData = async (queryParam) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/data?search=${queryParam}`);
      if (!res.ok) throw new Error("Failed to fetch data");

      const result = await res.json();
      setData(result);
      setStatusData({}); // reset old status
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------
  // 2️⃣ Poll status ONLY when data exists
  // ---------------------------------
  useEffect(() => {
    if (data.length === 0) return; // no data → no polling

    let intervalId;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) throw new Error("Failed to fetch status");

        const result = await res.json();
        setStatusData(result);
      } catch (err) {
        console.error("Status fetch error:", err);
      }
    }

    // fetch immediately
    fetchStatus();

    // start polling
    intervalId = setInterval(fetchStatus, 30000);

    return () => clearInterval(intervalId);
  }, [data]); // re-run if new search happens

  // ---------------------------------
  // 3️⃣ Combine data + status
  // ---------------------------------
  const combinedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      status: statusData[item.id] || "unknown"
    }));
  }, [data, statusData]);

  // ---------------------------------
  // 4️⃣ Filter + Sort
  // ---------------------------------
  const displayedData = useMemo(() => {
    return combinedData
      .filter(item =>
        item.name.toLowerCase().includes(filterText.toLowerCase())
      )
      .sort((a, b) =>
        sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
  }, [combinedData, filterText, sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  // ---------------------------------
  // Render
  // ---------------------------------
  return (
    <div style={{ padding: "20px" }}>
      <h2>Search Dashboard</h2>

      <button onClick={() => fetchData("example")}>
        Load Data
      </button>

      <div style={{ margin: "10px 0" }}>
        <input
          placeholder="Filter..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />

        <button onClick={toggleSort} style={{ marginLeft: "10px" }}>
          Sort: {sortOrder}
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      <ul>
        {displayedData.map(item => (
          <li key={item.id}>
            {item.name} — {item.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
