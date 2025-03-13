"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Tester() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              id: "1",
              content: "1 + 2 = 3?",
              role: "user",
              timestamp: new Date().toISOString(),
            },
            {
              id: "2",
              content: "Yes it does!",
              role: "assistant",
              timestamp: new Date().toISOString(),
            },
          ],
          // Provide a flashcardsList if you want to trigger generateObject,
          // otherwise omit it to trigger streamText in your API route.
          flashcardsList: [
            {
              id: "1",
              front: "Addition",
              back: "Process of adding numbers together",
              reason: "Initial test flashcard",
            },
          ],
        }),
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleTestSubmit} disabled={isLoading}>
        {isLoading ? "Loading..." : "Test generateObject"}
      </Button>
      {result && (
        <pre style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}