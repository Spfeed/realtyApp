import { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  approveApplication,
  getApplicationsByListingId,
  rejectApplication,
  type RentalApplication,
} from "../../api/applicationApi";

export function OwnerApplicationsPage() {
  const { listingId } = useParams();

  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [error, setError] = useState("");

  async function loadApplications() {
    if (!listingId) return;

    try {
      const data = await getApplicationsByListingId(Number(listingId));
      setApplications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки заявок");
    }
  }

  useEffect(() => {
    loadApplications();
  }, [listingId]);

  async function handleApprove(id: number) {
    try {
      await approveApplication(id);
      await loadApplications();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка одобрения заявки");
    }
  }

  async function handleReject(id: number) {
    try {
      await rejectApplication(id);
      await loadApplications();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отклонения заявки");
    }
  }

  return (
    <div>
      <h1>Заявки на объявление #{listingId}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {applications.length === 0 && <p>Заявок пока нет</p>}

      {applications.map((a) => (
        <div key={a.id} style={{ border: "1px solid gray", margin: 10, padding: 10 }}>
          <p>ID заявки: {a.id}</p>
          <p>ID пользователя: {a.userId}</p>
          <p>Статус: {a.status}</p>
          <p>ID чата: {a.conversationId ?? "ещё нет"}</p>

          {a.status === "PENDING" && (
            <>
              <button onClick={() => handleApprove(a.id)}>Одобрить</button>
              <button onClick={() => handleReject(a.id)}>Отклонить</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}