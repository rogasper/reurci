import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@reurci/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@reurci/ui/components/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@reurci/ui/components/skeleton";
import { ReIcon } from "@/components/reicon";
import Folder from "reicon/icons/Folder";
import Clock from "reicon/icons/Clock";
import Settings from "reicon/icons/Settings";
import ArrowLeft2 from "reicon/icons/ArrowLeft2";
import ArrowRight2 from "reicon/icons/ArrowRight2";
import Logout from "reicon/icons/Logout";

const Ink = "#08304c";
const Muted = "#797979";

const navItems = [
  { to: "/dashboard", label: "Workspace", icon: Folder },
  { to: "/history", label: "History", icon: Clock },
  { to: "/setup", label: "Setup", icon: Settings },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { data: session, isPending } = authClient.useSession();

  const currentPath = routerState.location.pathname;
  const isActive = (to: string) => {
    if (to === "/dashboard" && currentPath.startsWith("/dashboard")) return true;
    if (to === "/history" && currentPath.startsWith("/history")) return true;
    if (to === "/setup" && currentPath.startsWith("/setup")) return true;
    return false;
  };

  const sidebarWidth = collapsed ? 60 : 220;

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex flex-col transition-all"
      style={{ width: `${sidebarWidth}px`, height: "100dvh", background: "#fff", borderRight: "1px solid oklab(0 0 0 / 0.06)" }}
    >
      <div className="px-4 pt-5 pb-4 flex items-center gap-2">
        {!collapsed && (
          <>
            <div
              className="size-5 rounded-sm shrink-0"
              style={{
                background: "linear-gradient(90deg, #26c0ff, #e600c2 20%, #ff4940 40%, #ffa130 60%, #ffc837 80%, #00cc3d)",
              }}
            />
            <Link to="/" className="font-semibold text-base" style={{ color: Ink }}>
              REURCI
            </Link>
          </>
        )}
        <button
          onClick={onToggle}
          className="ml-auto rounded-[10px] p-1 hover:bg-[#f0f4f8] transition-colors shrink-0"
          style={{ color: Muted }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ReIcon icon={collapsed ? ArrowRight2 : ArrowLeft2} size={16} />
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-[14px] text-[14px] font-medium transition-colors ${collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"}`}
            style={{
              color: isActive(to) ? Ink : `oklab(0 0 0 / 0.45)`,
              background: isActive(to) ? "#e8f1ff" : "transparent",
            }}
            title={collapsed ? label : undefined}
          >
            <ReIcon icon={icon} size={18} color={isActive(to) ? Ink : `oklab(0 0 0 / 0.45)`} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t" style={{ borderColor: "oklab(0 0 0 / 0.06)" }}>
        {isPending ? (
          <Skeleton className={`h-8 ${collapsed ? "w-8" : "w-full"} rounded-[14px]`} />
        ) : session ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="xs"
                  className={collapsed ? "justify-center w-full px-0" : "w-full justify-start gap-2"}
                />
              }
            >
              <ReIcon icon={Folder} size={14} color={Muted} />
              {!collapsed && <span className="truncate">{session.user.name}</span>}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card min-w-[180px]" align="start" side="top">
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[11px] text-muted-foreground cursor-default">
                  {session.user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Link to="/setup">
                  <DropdownMenuItem>
                    <ReIcon icon={Settings} size={14} />
                    <span className="ml-2">Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    authClient.signOut({
                      fetchOptions: { onSuccess: () => navigate({ to: "/" }) },
                    })
                  }
                >
                  <ReIcon icon={Logout} size={14} />
                  <span className="ml-2">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login">
            <Button variant="outline" size="sm" className="w-full">
              {!collapsed ? "Sign In" : ""}
            </Button>
          </Link>
        )}
      </div>
    </aside>
  );
}
