import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <div className="container flex min-h-screen gap-4 p-4 md:p-8">
        <ChatInterface />
      </div>
    </main>
  );
}