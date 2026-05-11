import { useEffect, useState } from "react";
import { getMyApplications, type RentalApplication } from "../../api/applicationApi";
import { Link } from "react-router";

export function MyApplicationsPage() {
  const [apps, setApps] = useState<RentalApplication[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyApplications()
      .then(setApps)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Мои заявки</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {apps.map((a) => (
        <div key={a.id} style={{ border: "1px solid gray", margin: 10, padding: 10 }}>
          <p>ID заявки: {a.id}</p>
          <p>ID объявления: {a.listingId}</p>
          <p>Статус: {a.status}</p>

          {a.conversationId && (
            <Link to={`/chat/${a.conversationId}`}>
              <button>Открыть чат</button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}