import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  getSupportConversations,
  SUPPORT_USER_ID,
  type ConversationPreview,
} from "../../api/chatApi";
import { getUserById, type UserProfile } from "../../api/userApi";
import "./AdminSupportPage.css";

export function AdminSupportPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [profiles, setProfiles] = useState<Record<number, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSupportConversations() {
    try {
      setLoading(true);
      setError("");

      const data = await getSupportConversations();
      setConversations(data);

      const userIds = Array.from(
        new Set(
          data
            .flatMap((c) => [c.participant1Id, c.participant2Id])
            .filter((id) => id !== SUPPORT_USER_ID),
        ),
      );

      const loadedProfiles = await Promise.all(
        userIds.map((id) => getUserById(id)),
      );

      setProfiles(
        Object.fromEntries(
          loadedProfiles.map((profile) => [profile.authUserId, profile]),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка загрузки обращений",
      );
    } finally {
      setLoading(false);
    }
  }

  function getClientId(conversation: ConversationPreview) {
    return conversation.participant1Id === SUPPORT_USER_ID
      ? conversation.participant2Id
      : conversation.participant1Id;
  }

  function getClientName(conversation: ConversationPreview) {
    const clientId = getClientId(conversation);
    const profile = profiles[clientId];

    if (!profile) return `Пользователь ${clientId}`;

    return `${profile.name} ${profile.surname}`;
  }

  useEffect(() => {
    loadSupportConversations();
  }, []);

  return (
    <main className="admin-support-page">
      <div className="admin-support-header">
        <div>
          <p>Служба поддержки</p>
          <h1>Обращения пользователей</h1>
        </div>

        <button type="button" onClick={loadSupportConversations}>
          Обновить
        </button>
      </div>

      {error && <div className="admin-support-error">{error}</div>}

      {loading ? (
        <div className="admin-support-state">Загрузка обращений...</div>
      ) : conversations.length === 0 ? (
        <div className="admin-support-state">Обращений пока нет.</div>
      ) : (
        <section className="admin-support-list">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/chats/${conversation.id}`}
              state={{
                backTo: "/admin/support",
                backLabel: "К обращениям",
                supportConversation: conversation,
                supportClientId: getClientId(conversation),
                supportClientName: getClientName(conversation),
              }}
              className="admin-support-card"
            >
              <div>
                <span className="admin-support-card-kicker">
                  Обращение #{conversation.id}
                </span>

                <h2>{getClientName(conversation)}</h2>

                <p>{conversation.lastMessageText || "Сообщений пока нет"}</p>
              </div>

              <div className="admin-support-card-side">
                {conversation.unreadCount > 0 && (
                  <strong>{conversation.unreadCount}</strong>
                )}

                {conversation.lastMessageCreatedAt && (
                  <span>
                    {new Date(
                      conversation.lastMessageCreatedAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
