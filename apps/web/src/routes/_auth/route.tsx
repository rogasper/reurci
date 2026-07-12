import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Sidebar from "@/components/sidebar";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }
    return { session };
  },
});

function AuthLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 60 : 220;

  return (
    <div className="flex min-h-svh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className="transition-all"
        style={{ marginLeft: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)` }}
      >
        <Outlet />
      </main>
    </div>
  );
}
