"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";

interface AIAnalysisProps {
  message: string;
}

interface Analysis {
  sentiment: "positive" | "negative" | "neutral";
  keywords: string[];
  summary: string;
}

export function AIAnalysis({ message }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!message) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);

    // Placeholder for AI analysis integration
    // Replace with actual AI SDK calls
    setTimeout(() => {
      setAnalysis({
        sentiment: "positive",
        keywords: ["example", "keywords", "analysis"],
        summary: "This is a placeholder summary of the message content.",
      });
      setIsAnalyzing(false);
    }, 1000);
  }, [message]);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5" />
        <h2 className="font-semibold">AI Analysis</h2>
      </div>
      
      {!message && (
        <p className="text-sm text-muted-foreground">
          Send a message to see AI analysis
        </p>
      )}

      {isAnalyzing && (
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse"></div>
          <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Sentiment</h3>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {analysis.sentiment}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">Keywords</h3>
            <div className="flex flex-wrap gap-1">
              {analysis.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">Summary</h3>
            <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          </div>
        </div>
      )}
    </Card>
  );
}