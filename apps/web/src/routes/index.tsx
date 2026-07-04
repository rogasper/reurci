import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { env } from "@reurci/env/web";
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
      .catch(() => { setAiStatus("Disconnected"); setAiError(true); });
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] px-4" style={{ paddingTop: "100px" }}>
      <div className="max-w-[520px] mx-auto text-center mb-16">
        <h1
          className="font-semibold leading-none tracking-tight"
          style={{ fontSize: "44px", color: "#08304c", letterSpacing: "-1.15px" }}
        >
          REURCI
        </h1>
        <p className="mt-6" style={{ fontSize: "18px", color: "#2c2c2c", lineHeight: 1.45 }}>
          Rearrange Your CV. Tailor every application with AI.
        </p>
      </div>

      <div className="grid gap-6 max-w-[600px] mx-auto">
        <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
          <h2 className="mb-3 font-medium" style={{ fontSize: "16px", color: "#08304c" }}>API Status</h2>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`} />
            <span style={{ fontSize: "12px", color: "#797979" }}>
              {healthCheck.isLoading ? "Checking..." : healthCheck.data ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="rounded-[24px] bg-white p-6" style={{ boxShadow: "0 0 0 1px oklab(0 0 0 / 0.04), 0 16px 16px -8px rgba(0,0,0,0.03), 0 5px 5px -2.5px rgba(0,0,0,0.03)" }}>
          <h2 className="mb-3 font-medium" style={{ fontSize: "16px", color: "#08304c" }}>AI Status</h2>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${aiStatus === "Checking..." ? "bg-yellow-500" : aiError ? "bg-red-500" : "bg-green-500"}`} />
            <span style={{ fontSize: "12px", color: "#797979" }}>{aiStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
