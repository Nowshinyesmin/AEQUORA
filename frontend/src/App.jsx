// src/App.jsx  (optional, not used by main.jsx right now)

import { useEffect, useState } from "react";
import { api } from "./api/client";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get("ping/")
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
        setData({ error: "Failed to reach backend" });
      });
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>AEQUORA FRONTEND</h1>
      <p>Backend response:</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;
