import { Client } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  getMyConversations,
  type ConversationPreview,
} from "../../api/chatApi";
import { getUserById, type UserProfile } from "../../api/userApi";
import "./chats.css";

export function ChatsPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [profiles, setProfiles] = useState<Record<number, UserProfile>>({});
  const [error, setError] = useState("");

  const clientRef = useRef<Client | null>(null);

  function getMyUserIdFromToken(): number | null {
    const token = sessionStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId;
    } catch {
      return null;
    }
  }

  const myUserId = getMyUserIdFromToken();

  async function loadProfiles(convs: ConversationPreview[]) {
    const ids = new Set<number>();

    convs.forEach((c) => {
      ids.add(c.participant1Id);
      ids.add(c.participant2Id);

      if (c.lastMessageSenderId) {
        ids.add(c.lastMessageSenderId);
      }
    });

    const missing = Array.from(ids).filter((id) => !profiles[id]);

    if (missing.length === 0) return;

    const loaded = await Promise.all(missing.map((id) => getUserById(id)));

    setProfiles((prev) => {
      const updated = { ...prev };

      loaded.forEach((p) => {
        updated[p.authUserId] = p;
      });

      return updated;
    });
  }

  function getDisplayName(userId: number) {
    const profile = profiles[userId];

    if (!profile) return `Пользователь ${userId}`;

    return `${profile.name} ${profile.surname[0]}.`;
  }

  function getOtherUser(c: ConversationPreview) {
    if (!myUserId) return c.participant1Id;

    return c.participant1Id === myUserId
      ? c.participant2Id
      : c.participant1Id;
  }

  function getLastMessageText(c: ConversationPreview) {
    if (!c.lastMessageText) {
      return "Нет сообщений";
    }

    if (!c.lastMessageSenderId) {
      return c.lastMessageText;
    }

    const senderName = getDisplayName(c.lastMessageSenderId);

    return `${senderName}: ${c.lastMessageText}`;
  }

  useEffect(() => {
    getMyConversations()
      .then((data) => {
        setConversations(data);
        loadProfiles(data);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!myUserId) return;

    const token = sessionStorage.getItem("token");

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws/chat",
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/chat-updates/${myUserId}`, (message) => {
          const updated = JSON.parse(message.body) as ConversationPreview;

          setConversations((prev) => {
            const withoutUpdated = prev.filter((c) => c.id !== updated.id);
            return [updated, ...withoutUpdated];
          });

          loadProfiles([updated]);
        });
      },

      onStompError: (frame) => {
        setError(frame.headers["message"] || "Ошибка WebSocket");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [myUserId]);

  return (
  <div className="chats-layout">
    <header className="chats-topbar">
      <div className="chats-logo">StayVille</div>
      <input
        className="chats-search"
        placeholder="Поиск по чатам и сообщениям"
      />
    </header>

    <main className="chats-main">
      <aside className="chats-sidebar">
        <h1 className="chats-sidebar-title">Чаты</h1>
        <p className="chats-sidebar-subtitle">
          Последние сообщения и новые запросы
        </p>

        {error && <p className="chat-error">{error}</p>}

        {conversations.length === 0 && (
          <p className="chat-empty">Чатов пока нет</p>
        )}

        {conversations.map((c, index) => {
          const otherUserId = getOtherUser(c);
          const name = getDisplayName(otherUserId);

          return (
            <Link
              key={c.id}
              to={`/chat/${c.id}`}
              className="chat-preview-link"
            >
              <div
                className={
                  index === 0
                    ? "chat-preview chat-preview-active"
                    : "chat-preview"
                }
              >
                <div className="chat-avatar">
                  {name[0]}
                </div>

                <div>
                  <h3 className="chat-preview-name">
                    {name}
                    {c.unreadCount > 0 && (
                      <span className="chat-unread">
                        ({c.unreadCount})
                      </span>
                    )}
                  </h3>

                  <p className="chat-preview-message">
                    {getLastMessageText(c)}
                  </p>
                </div>

                {c.lastMessageCreatedAt && (
                  <span className="chat-preview-time">
                    {new Date(c.lastMessageCreatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </aside>

      <section className="chat-window">
        <div className="chat-messages">
          <p className="chat-empty">
            Выберите чат, чтобы открыть переписку
          </p>
        </div>
      </section>
    </main>
  </div>
);
}