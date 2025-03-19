import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-grow gap-2 pt-4">
        <ChatInterface />
      </div>
    </main>
  );
}