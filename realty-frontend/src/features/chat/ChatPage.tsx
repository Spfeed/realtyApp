import { Client } from "@stomp/stompjs";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router";
import {
  getMessages,
  getUserOnlineStatus,
  SUPPORT_USER_ID,
  type ChatMessage,
  type ConversationPreview,
  type ReadReceipt,
  type TypingEvent,
} from "../../api/chatApi";
import { getUserById, type UserProfile } from "../../api/userApi";
import "./chats.css";
import { ArrowLeft, Check, CheckCheck, Send } from "lucide-react";
import { loadProtectedMedia } from "../../api/media";
import { getCurrentUserRole } from "../../api/authApi";
import { WS_BASE_URL } from "../../api/config";

export function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const backState = location.state as {
    backTo?: string;
    backLabel?: string;
    supportConversation?: ConversationPreview;
    supportClientId?: number;
    supportClientName?: string;
  } | null;

  const {
    conversations,
    profiles: layoutProfiles,
    getOtherUser,
    getDisplayName,
    markConversationAsRead,
  } = useOutletContext<{
    conversations: ConversationPreview[];
    profiles: Record<number, UserProfile>;
    myUserId: number | null;
    getOtherUser: (c: ConversationPreview) => number;
    getDisplayName: (userId: number) => string;
    markConversationAsRead: (conversationId: number) => void;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<number, UserProfile>>({});
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [otherUserAvatarUrl, setOtherUserAvatarUrl] = useState("");

  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesCountRef = useRef(0);
  const typingTimeoutRef = useRef<number | null>(null);
  const stopTypingTimeoutRef = useRef<number | null>(null);

  const role = getCurrentUserRole();
  const isStaff = role === "ADMIN" || role === "MODERATOR";

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

  const activeConversation = conversations.find(
    (c) => c.id === Number(conversationId),
  );

  const visibleConversation =
    activeConversation ?? backState?.supportConversation ?? null;

  const isSupportChat =
    visibleConversation?.participant1Id === SUPPORT_USER_ID ||
    visibleConversation?.participant2Id === SUPPORT_USER_ID;

  const otherUserId = isSupportChat
    ? (backState?.supportClientId ?? null)
    : visibleConversation
      ? getOtherUser(visibleConversation)
      : null;

  const contextBackTo =
    backState?.backTo ??
    (visibleConversation?.listingId
      ? `/listings/${visibleConversation.listingId}`
      : "/profile");

  const contextBackLabel =
    backState?.backLabel ??
    (visibleConversation?.listingId ? "К объявлению" : "В профиль");

  const otherUserName = isSupportChat
    ? (backState?.supportClientName ?? "Пользователь")
    : otherUserId
      ? getDisplayName(otherUserId)
      : `Чат #${conversationId}`;

  const otherUserProfile = otherUserId
    ? profiles[otherUserId] || layoutProfiles[otherUserId]
    : null;

  useEffect(() => {
    if (!otherUserId || isSupportChat) return;

    getUserOnlineStatus(otherUserId)
      .then(setIsOtherUserOnline)
      .catch(() => setIsOtherUserOnline(false));
  }, [otherUserId, isSupportChat]);

  async function loadMissingProfiles(messagesToCheck: ChatMessage[]) {
    const uniqueSenderIds = Array.from(
      new Set(messagesToCheck.map((m) => m.senderId)),
    ).filter((id) => id !== SUPPORT_USER_ID);

    const missingIds = uniqueSenderIds.filter((id) => !profiles[id]);
    if (missingIds.length === 0) return;

    const loadedProfiles = await Promise.all(
      missingIds.map((id) => getUserById(id)),
    );

    setProfiles((prev) => {
      const updated = { ...prev };

      loadedProfiles.forEach((profile) => {
        updated[profile.authUserId] = profile;
      });

      return updated;
    });
  }

  useEffect(() => {
    if (!conversationId) return;

    const id = Number(conversationId);
    const token = sessionStorage.getItem("token");

    getMessages(id)
      .then((data) => {
        setMessages(data);
        loadMissingProfiles(data);
      })
      .catch((e) => setError(e.message));

    const client = new Client({
      brokerURL: `${WS_BASE_URL}/ws/chat`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/chat/${id}`, (message) => {
          const body = JSON.parse(message.body) as ChatMessage;

          setMessages((prev) => [...prev, body]);
          loadMissingProfiles([body]);

          if (myUserId !== body.senderId) {
            client.publish({
              destination: "/app/chat.read",
              body: JSON.stringify({
                conversationId: id,
              }),
            });

            markConversationAsRead(id);
          }
        });

        client.subscribe(`/topic/chat/${id}/read`, (message) => {
          const receipt = JSON.parse(message.body) as ReadReceipt;

          setMessages((prev) =>
            prev.map((m) =>
              m.id && receipt.messageIds.includes(m.id)
                ? { ...m, status: "READ" }
                : m,
            ),
          );
        });

        if (otherUserId && !isSupportChat) {
          client.subscribe(`/topic/presence/${otherUserId}`, (message) => {
            const online = JSON.parse(message.body) as boolean;
            setIsOtherUserOnline(online);
          });
        }

        client.subscribe(`/topic/chat/${id}/typing`, (message) => {
          const event = JSON.parse(message.body) as TypingEvent;

          if (event.userId === myUserId) return;

          setIsOtherUserTyping(event.typing);

          if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
          }

          if (event.typing) {
            typingTimeoutRef.current = window.setTimeout(() => {
              setIsOtherUserTyping(false);
            }, 3000);
          }
        });

        client.publish({
          destination: "/app/chat.read",
          body: JSON.stringify({
            conversationId: id,
          }),
        });

        markConversationAsRead(id);
      },
      onStompError: (frame) => {
        setError(frame.headers["message"] || "Ошибка WebSocket");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      if (stopTypingTimeoutRef.current) {
        window.clearTimeout(stopTypingTimeoutRef.current);
      }
    };
  }, [conversationId, otherUserId]);

  useEffect(() => {
    const previousCount = previousMessagesCountRef.current;
    const currentCount = messages.length;

    if (currentCount === 0) {
      previousMessagesCountRef.current = currentCount;
      return;
    }

    if (previousCount === 0) {
      scrollToBottom("auto");
      previousMessagesCountRef.current = currentCount;
      return;
    }

    if (currentCount > previousCount) {
      const lastMessage = messages[currentCount - 1];
      const isOwnMessage = lastMessage.senderId === myUserId;

      if (isOwnMessage || isNearBottom()) {
        scrollToBottom();
      } else {
        setShowScrollButton(true);
        setNewMessagesCount((prev) => prev + (currentCount - previousCount));
      }
    }

    previousMessagesCountRef.current = currentCount;
  }, [messages]);

  useEffect(() => {
    if (!otherUserProfile?.avatarUrl) {
      setOtherUserAvatarUrl("");
      return;
    }

    let objectUrl = "";

    loadProtectedMedia(otherUserProfile.avatarUrl)
      .then((url) => {
        objectUrl = url;
        setOtherUserAvatarUrl(url);
      })
      .catch(() => setOtherUserAvatarUrl(""));

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [otherUserProfile?.avatarUrl]);

  function getSenderName(senderId: number) {
    if (senderId === SUPPORT_USER_ID) {
      return "Служба поддержки";
    }
    const profile = profiles[senderId];

    if (!profile) {
      return `Пользователь ${senderId}`;
    }

    return `${profile.name} ${profile.surname[0]}.`;
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!text.trim() || !conversationId || !clientRef.current?.connected) {
      return;
    }

    clientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({
        conversationId: Number(conversationId),
        text,
      }),
    });

    publishTyping(false);
    setText("");
  }

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatMessageDate(dateString?: string) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) return "Сегодня";
    if (isSameDay(date, yesterday)) return "Вчера";

    const sameYear = date.getFullYear() === today.getFullYear();

    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      ...(sameYear ? {} : { year: "numeric" }),
    });
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });

    setNewMessagesCount(0);
  }

  function handleMessagesScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 120;

    setShowScrollButton(!nearBottom);

    if (nearBottom) {
      setNewMessagesCount(0);
    }
  }

  function isNearBottom() {
    const el = messagesContainerRef.current;
    if (!el) return true;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom < 120;
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;

    e.preventDefault();

    if (!text.trim()) return;

    sendMessage(e);
  }

  function publishTyping(typing: boolean) {
    if (!conversationId || !clientRef.current?.connected) return;

    clientRef.current.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify({
        conversationId: Number(conversationId),
        typing,
      }),
    });
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);

    publishTyping(true);

    if (stopTypingTimeoutRef.current) {
      window.clearTimeout(stopTypingTimeoutRef.current);
    }

    stopTypingTimeoutRef.current = window.setTimeout(() => {
      publishTyping(false);
    }, 1200);
  }

  return (
    <section className="chat-window">
      <header className="chat-window-header">
        <button
          type="button"
          className="chat-back-button"
          onClick={() => navigate("/chats")}
        >
          <ArrowLeft size={20} />
        </button>

        <Link to={contextBackTo} className="chat-context-back-button">
          <ArrowLeft size={18} />
          <span>{contextBackLabel}</span>
        </Link>

        <Link
          to={otherUserId ? `/users/${otherUserId}` : "#"}
          className="chat-user-link"
        >
          <div className="chat-avatar">
            {otherUserAvatarUrl ? (
              <img
                src={otherUserAvatarUrl}
                alt=""
                className="chat-avatar-img"
              />
            ) : (
              otherUserName[0]
            )}
          </div>

          <div>
            <h1 className="chat-window-title">{otherUserName}</h1>
            <p className="chat-window-subtitle">
              {isSupportChat && isStaff
                ? "обращение в службу поддержки"
                : isOtherUserTyping
                  ? `${otherUserName} печатает...`
                  : isOtherUserOnline
                    ? "online"
                    : "offline"}
            </p>
          </div>
        </Link>
      </header>

      {error && <p className="chat-error">{error}</p>}

      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
      >
        {messages.map((m, index) => {
          const isOwn =
            myUserId === m.senderId ||
            (isSupportChat && isStaff && m.senderId === SUPPORT_USER_ID);

          const currentMessageDate = m.createdAt
            ? formatMessageDate(m.createdAt)
            : "";

          const previousMessageDate =
            index > 0 && messages[index - 1].createdAt
              ? formatMessageDate(messages[index - 1].createdAt)
              : "";

          const shouldShowDate =
            currentMessageDate && currentMessageDate !== previousMessageDate;

          const isSystem = m.type === "SYSTEM";

          return (
            <div key={m.id ?? index}>
              {shouldShowDate && (
                <div className="chat-date-separator">{currentMessageDate}</div>
              )}

              {isSystem ? (
                <div className="chat-system-separator">{m.text}</div>
              ) : (
                <div
                  className={
                    isOwn
                      ? "chat-message-row chat-message-row-own"
                      : "chat-message-row"
                  }
                >
                  <div
                    className={
                      isOwn ? "chat-message chat-message-own" : "chat-message"
                    }
                  >
                    {!isOwn && (
                      <p className="chat-preview-name">
                        {getSenderName(m.senderId)}
                      </p>
                    )}

                    <p className="chat-message-text">{m.text}</p>

                    <div className="chat-message-meta">
                      <span>
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>

                      {isOwn && (
                        <span className="chat-read-icon">
                          {m.status === "READ" ? (
                            <CheckCheck size={14} />
                          ) : (
                            <Check size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          className="chat-scroll-bottom-button"
          onClick={() => scrollToBottom()}
          type="button"
        >
          ↓
          {newMessagesCount > 0 && (
            <span className="chat-scroll-new-count">{newMessagesCount}</span>
          )}
        </button>
      )}

      <form onSubmit={sendMessage} className="chat-input-form">
        <textarea
          className="chat-input chat-textarea"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Напишите сообщение..."
          rows={1}
        />

        <button
          className="chat-send-button"
          type="submit"
          disabled={!text.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  );
}
