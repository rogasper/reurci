import { Link } from "@tanstack/react-router";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/setup", label: "Setup" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <div className="w-full px-4">
      <nav className="floating-nav">
        <div className="flex items-center gap-1">
          <div
            className="size-5 rounded-sm"
            style={{
              background:
                "linear-gradient(90deg, #26c0ff, #e600c2 20%, #ff4940 40%, #ffa130 60%, #ffc837 80%, #00cc3d)",
            }}
          />
          <Link to="/" className="font-semibold text-base">
            REURCI
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-[14px] font-medium transition-opacity hover:opacity-70"
              activeProps={{ className: "opacity-100 underline underline-offset-4" }}
            >
              {label}
            </Link>
          ))}
          <UserMenu />
        </div>
      </nav>
    </div>
  );
}
