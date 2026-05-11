import { Link } from "react-router";
import { useEffect, useState } from "react";
import { getMyListings, type Listing } from "../../api/listingApi";

export function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyListings()
      .then(setListings)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Мои объявления</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {listings.map((l) => (
        <div key={l.id} style={{ border: "1px solid gray", margin: 10, padding: 10 }}>
          <h3>{l.title}</h3>
          <p>Цена: {l.price}</p>
          <p>Статус: {l.status}</p>

          <Link to={`/owner/listings/${l.id}/applications`}>
            <button>Заявки</button>
          </Link>
        </div>
      ))}
    </div>
  );
}