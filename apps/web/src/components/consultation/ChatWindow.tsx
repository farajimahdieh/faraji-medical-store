"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { useChat } from "./useChat";
import { ChatMessageBubble } from "./ChatMessageBubble";

const INTRO_TEXT =
  "سلام! من دستیار مشاور خرید فرجی هستم. نیاز یا مشکلتان را بگویید تا محصول مناسب را پیشنهاد دهم.";

export function ChatWindow() {
  const { messages, status, send } = useChat();
  const [draft, setDraft] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages.length, status]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft;
    setDraft("");
    void send(text);
  }

  return (
    <div className="flex h-[70vh] min-h-[480px] flex-col rounded-2xl border border-border bg-white">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-medical-bg text-primary">
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <h1 className="text-base font-bold text-navy">مشاوره هوشمند فرجی</h1>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <ChatMessageBubble message={{ id: "intro", role: "assistant", content: INTRO_TEXT }} />

        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}

        {status === "sending" && (
          <div className="w-fit rounded-2xl rounded-tr-sm bg-medical-bg px-4 py-2.5 text-sm text-secondary-text">
            در حال تایپ...
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-accent-red">
            ارسال پیام با خطا مواجه شد. لطفاً دوباره تلاش کنید.
          </p>
        )}

        <div ref={listEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-4">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="پیام خود را بنویسید..."
          disabled={status === "sending"}
          className="h-11 flex-1 rounded-xl border border-border bg-white px-4 text-sm text-navy outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "sending" || draft.trim().length === 0}
          aria-label="ارسال پیام"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
