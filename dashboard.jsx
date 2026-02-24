import { useState, useEffect, useMemo } from "react";

function Dashboard() {
  // Base data (fetched once)
  const [data, setData] = useState([]);

  // Status data (refreshed every 30s)
  const [statusData, setStatusData] = useState({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterText, setFilterText] = useState("");

  // ---------------------------------
  // 1️⃣ Fetch main data once on mount
  // ---------------------------------
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("Failed to fetch data");

        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // ---------------------------------
  // 2️⃣ Fetch status data every 30s
  // ---------------------------------
  useEffect(() => {
    let intervalId;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) throw new Error("Failed to fetch status");

        const result = await res.json();

        // Example structure:
        // { "1": "online", "2": "offline" }
        setStatusData(result);
      } catch (err) {
        console.error("Status fetch error:", err);
      }
    }

    // Fetch immediately on mount
    fetchStatus();

    // Then fetch every 30 seconds
    intervalId = setInterval(fetchStatus, 30000);

    // Cleanup (VERY important)
    return () => clearInterval(intervalId);
  }, []);

  // ---------------------------------
  // 3️⃣ Combine data + statusData
  // ---------------------------------
  const combinedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      status: statusData[item.id] || "unknown"
    }));
  }, [data, statusData]);

  // ---------------------------------
  // 4️⃣ Filter + Sort combined data
  // ---------------------------------
  const displayedData = useMemo(() => {
    return combinedData
      .filter(item =>
        item.name.toLowerCase().includes(filterText.toLowerCase())
      )
      .sort((a, b) => {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
  }, [combinedData, sortOrder, filterText]);

  const toggleSort = () => {
    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
  };

  // ---------------------------------
  // Render
  // ---------------------------------
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Dashboard</h2>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Filter by name..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />

        <button onClick={toggleSort} style={{ marginLeft: "10px" }}>
          Sort: {sortOrder === "asc" ? "Ascending" : "Descending"}
        </button>
      </div>

      <ul>
        {displayedData.map(item => (
          <li key={item.id}>
            {item.name} — Status: {item.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
