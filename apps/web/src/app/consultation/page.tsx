"use client";

import { Container } from "@/components/ui/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChatWindow } from "@/components/consultation/ChatWindow";
import { ConsultationLoginPrompt } from "@/components/consultation/ConsultationLoginPrompt";

export default function ConsultationPage() {
  const { status } = useAuth();

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-navy">مشاوره هوشمند</h1>
      <p className="mt-1 text-sm text-secondary-text">
        نیاز یا علائم خود را شرح دهید تا محصول مناسب را پیشنهاد دهیم.
      </p>

      <div className="mt-8">
        {status === "anonymous" && <ConsultationLoginPrompt />}
        {status === "authenticated" && <ChatWindow />}
      </div>
    </Container>
  );
}
