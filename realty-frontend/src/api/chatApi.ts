import { request } from "./http";

export type MessageStatus = "SENT" | "READ";
export type MessageType = "USER" | "SYSTEM";
export const SUPPORT_USER_ID = -1;

export type ChatMessage = {
  id?: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdAt?: string;
  status?: MessageStatus;
  type?: MessageType;
};

export type ConversationPreview = {
  id: number;
  listingId: number | null;

  participant1Id: number;
  participant2Id: number;

  createdAt: string;

  lastMessageText?: string;
  lastMessageSenderId?: number;
  lastMessageCreatedAt?: string;
  lastMessageType?: MessageType;

  unreadCount: number;
};

export type ReadReceipt = {
  conversationId: number;
  readerId: number;
  messageIds: number[];
};

export type TypingEvent = {
  conversationId: number;
  userId: number;
  typing: boolean;
};

export type Conversation = {
  id: number;
  listingId: number | null;
  participant1Id: number;
  participant2Id: number;
  createdAt: string;
};

export async function getMessages(conversationId: number) {
  return request<ChatMessage[]>(`/api/conversations/${conversationId}/messages`);
}

export async function getMyConversations() {
  return request<ConversationPreview[]>("/api/conversations/my");
}

export async function markAsRead(conversationId: number) {
  return request<void>(`/api/conversations/${conversationId}/read`, {
    method: "PATCH",
  });
}

export async function getUserOnlineStatus(userId: number) {
  return request<boolean>(`/api/conversations/presence/${userId}`);
}

export async function createConversation(listingId: number, otherUserId: number) {
  return request<Conversation>(
    `/api/conversations?listingId=${listingId}&otherUserId=${otherUserId}`,
    {
      method: "POST",
    }
  );
}

export async function createSupportConversation() {
  return request<ConversationPreview>("/api/conversations/support", {
    method: "POST",
  });
}

export async function getSupportConversations() {
  return request<ConversationPreview[]>("/api/conversations/support");
}