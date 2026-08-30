"use client";

import { useCallback, useState } from "react";
import { sendChatMessage, type PublicProductListItem } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: PublicProductListItem[];
}

export type ChatSendStatus = "idle" | "sending" | "error";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [status, setStatus] = useState<ChatSendStatus>("idle");

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status === "sending") return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed },
      ]);
      setStatus("sending");

      try {
        const response = await sendChatMessage(trimmed, conversationId);
        setConversationId(response.conversationId);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response.message,
            products: response.products,
          },
        ]);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    },
    [conversationId, status],
  );

  return { messages, status, send };
}
