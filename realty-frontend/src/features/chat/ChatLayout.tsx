import { Client } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router";
import {
  getMyConversations,
  getUserOnlineStatus,
  SUPPORT_USER_ID,
  type ConversationPreview,
  type TypingEvent,
} from "../../api/chatApi";
import { getMyProfile, getUserById, type UserProfile } from "../../api/userApi";
import "./chats.css";
import { ProtectedAvatar } from "../../components/ProtecredAvatar";
import { WS_BASE_URL } from "../../api/config";

function isSupportConversation(c: ConversationPreview) {
  return (
    c.participant1Id === SUPPORT_USER_ID || c.participant2Id === SUPPORT_USER_ID
  );
}

export function ChatLayout() {
  const { conversationId } = useParams();

  const location = useLocation();

  const chatBackState = location.state as {
    backTo?: string;
    backLabel?: string;
  } | null;

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [profiles, setProfiles] = useState<Record<number, UserProfile>>({});
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Record<number, boolean>>({});
  const [typingByConversation, setTypingByConversation] = useState<
    Record<number, boolean>
  >({});

  const typingTimeoutsRef = useRef<Record<number, number>>({});

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
      if (c.participant1Id !== SUPPORT_USER_ID) {
        ids.add(c.participant1Id);
      }

      if (c.participant2Id !== SUPPORT_USER_ID) {
        ids.add(c.participant2Id);
      }

      if (c.lastMessageSenderId && c.lastMessageSenderId !== SUPPORT_USER_ID) {
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
    if (userId === SUPPORT_USER_ID) {
      return "Служба поддержки";
    }
    const profile = profiles[userId];

    if (!profile) return `Пользователь ${userId}`;

    return `${profile.name} ${profile.surname[0]}.`;
  }

  function getOtherUser(c: ConversationPreview) {
    if (!myUserId) return c.participant1Id;

    return c.participant1Id === myUserId ? c.participant2Id : c.participant1Id;
  }

  function getLastMessageText(c: ConversationPreview) {
    if (!c.lastMessageText) {
      return "Нет сообщений";
    }

    if (c.lastMessageType === "SYSTEM") {
      return c.lastMessageText;
    }

    if (!c.lastMessageSenderId) {
      return c.lastMessageText;
    }

    const senderName =
      c.lastMessageSenderId === SUPPORT_USER_ID
        ? "Поддержка"
        : getDisplayName(c.lastMessageSenderId);

    return `${senderName}: ${c.lastMessageText}`;
  }

  useEffect(() => {
    getMyConversations()
      .then((data) => {
        setConversations(data);
        loadProfiles(data);
        loadOnlineStatuses(data);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    getMyProfile()
      .then(setMyProfile)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!myUserId) return;

    const token = sessionStorage.getItem("token");

    const client = new Client({
      brokerURL: `${WS_BASE_URL}/ws/chat`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/chat-updates/${myUserId}`, (message) => {
          const updated = JSON.parse(message.body) as ConversationPreview;

          setConversations((prev) => {
            const activeConversationId = Number(conversationId);

            const normalizedUpdated =
              Number(updated.id) === activeConversationId
                ? { ...updated, unreadCount: 0 }
                : updated;

            const withoutUpdated = prev.filter(
              (c) => Number(c.id) !== Number(updated.id),
            );

            return [normalizedUpdated, ...withoutUpdated];
          });

          loadProfiles([updated]);
        });
        conversations.forEach((c) => {
          const otherUserId = getOtherUser(c);

          client.subscribe(`/topic/presence/${otherUserId}`, (message) => {
            const online = JSON.parse(message.body) as boolean;

            setOnlineUsers((prev) => ({
              ...prev,
              [otherUserId]: online,
            }));
          });

          client.subscribe(`/topic/chat/${c.id}/typing`, (message) => {
            const event = JSON.parse(message.body) as TypingEvent;

            if (event.userId === myUserId) return;

            setTypingByConversation((prev) => ({
              ...prev,
              [event.conversationId]: event.typing,
            }));

            if (typingTimeoutsRef.current[event.conversationId]) {
              window.clearTimeout(
                typingTimeoutsRef.current[event.conversationId],
              );
            }

            if (event.typing) {
              typingTimeoutsRef.current[event.conversationId] =
                window.setTimeout(() => {
                  setTypingByConversation((prev) => ({
                    ...prev,
                    [event.conversationId]: false,
                  }));
                }, 3000);
            }
          });
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
      Object.values(typingTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });

      typingTimeoutsRef.current = {};
    };
  }, [myUserId, conversationId, conversations.length]);

  function markConversationAsRead(conversationId: number) {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }

  const filteredConversations = conversations.filter((c) => {
    const otherUserId = getOtherUser(c);
    const name = getDisplayName(otherUserId).toLowerCase();
    const lastMessage = getLastMessageText(c).toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return name.includes(query) || lastMessage.includes(query);
  });

  async function loadOnlineStatuses(convs: ConversationPreview[]) {
    const ids = Array.from(new Set(convs.map((c) => getOtherUser(c)))).filter(
      (id) => id !== SUPPORT_USER_ID,
    );

    const statuses = await Promise.all(
      ids.map(async (id) => ({
        id,
        online: await getUserOnlineStatus(id),
      })),
    );

    setOnlineUsers((prev) => {
      const updated = { ...prev };

      statuses.forEach((s) => {
        updated[s.id] = s.online;
      });

      return updated;
    });
  }

  return (
    <div className={conversationId ? "chats-layout has-active-chat" : "chats-layout"}>
      <header className="chats-topbar">
        <div className="chats-logo">
          <img src="/icons/home.svg" alt="home" className="chats-home-icon" />
          StayVille
        </div>

        <input
          className="chats-search"
          placeholder="Поиск по чатам и сообщениям"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Link to="/profile" className="chats-profile-link">
          <ProtectedAvatar
            avatarUrl={myProfile?.avatarUrl}
            fallback={myProfile ? myProfile.name[0] : "П"}
            className="chats-profile-avatar"
            imgClassName="chats-profile-avatar-img"
          />

          {myProfile && (
            <span className="chats-profile-name">{myProfile.name}</span>
          )}
        </Link>
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

          {conversations.length > 0 && filteredConversations.length === 0 && (
            <p className="chat-empty">Ничего не найдено</p>
          )}

          {filteredConversations.map((c) => {
            const otherUserId = getOtherUser(c);
            const name = getDisplayName(otherUserId);
            const isActive = Number(conversationId) === Number(c.id);
            const visibleUnreadCount = isActive ? 0 : c.unreadCount;
            const isTyping = typingByConversation[c.id];
            const profile = profiles[otherUserId];
            const isSupport = isSupportConversation(c);

            return (
              <Link
                key={c.id}
                to={`/chats/${c.id}`}
                state={chatBackState}
                className="chat-preview-link"
              >
                <div
                  className={
                    isActive
                      ? "chat-preview chat-preview-active"
                      : "chat-preview"
                  }
                >
                  <div className="chat-preview-avatar-wrap">
                    <ProtectedAvatar
                      avatarUrl={profile?.avatarUrl}
                      fallback={isSupport ? "С" : name[0]}
                      className="chat-avatar"
                      imgClassName="chat-avatar-img"
                    />

                    {!isSupport && onlineUsers[otherUserId] && (
                      <span className="chat-online-dot" />
                    )}
                  </div>

                  <div className="chat-preview-content">
                    <h3 className="chat-preview-name">
                      {name}

                      {visibleUnreadCount > 0 && (
                        <span className="chat-unread">
                          {visibleUnreadCount}
                        </span>
                      )}
                    </h3>

                    <p
                      className={
                        isTyping
                          ? "chat-preview-message chat-preview-typing"
                          : "chat-preview-message"
                      }
                    >
                      {isTyping ? `${name} печатает...` : getLastMessageText(c)}
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

        <Outlet
          context={{
            conversations,
            profiles,
            myUserId,
            getOtherUser,
            getDisplayName,
            markConversationAsRead,
          }}
        />
      </main>
    </div>
  );
}
