import { env } from "@reurci/env/web";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const trpc = useTRPC();
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  const [aiStatus, setAiStatus] = useState<string>("Checking...");
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    fetch(`${env.VITE_SERVER_URL}/api/ai/ping`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.text) setAiStatus(d.text);
        else throw new Error("No text in response");
      })
      .catch(() => {
        setAiStatus("Disconnected");
        setAiError(true);
      });
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <h1 className="mb-6 text-2xl font-bold">REURCI</h1>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-muted-foreground text-sm">
              {healthCheck.isLoading
                ? "Checking..."
                : healthCheck.data
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </div>
        </section>
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">AI Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${aiStatus === "Checking..." ? "bg-yellow-500" : aiError ? "bg-red-500" : "bg-green-500"}`}
            />
            <span className="text-muted-foreground text-sm">{aiStatus}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
