import { ProductCard } from "@/components/catalog/ProductCard";
import type { ChatMessage } from "./useChat";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${
          isUser
            ? "rounded-tl-sm bg-primary text-white"
            : "rounded-tr-sm bg-medical-bg text-navy"
        }`}
      >
        {message.content}
      </div>

      {message.products && message.products.length > 0 && (
        <div className="grid w-full max-w-[85%] grid-cols-1 gap-4 sm:grid-cols-2">
          {message.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
