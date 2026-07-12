import { Link } from "@tanstack/react-router";
import { Button } from "@reurci/ui/components/button";

export default function Header() {
  return (
    <div className="w-full px-4">
      <nav
        className="floating-nav flex items-center justify-between mx-auto"
      >
        <div className="flex items-center gap-2">
          <div
            className="size-5 rounded-sm"
            style={{
              background:
                "linear-gradient(90deg, #26c0ff, #e600c2 20%, #ff4940 40%, #ffa130 60%, #ffc837 80%, #00cc3d)",
            }}
          />
          <Link to="/" className="font-semibold text-base" style={{ color: "#08304c" }}>
            REURCI
          </Link>
        </div>
        <Link to="/login">
          <Button variant="rainbow" size="sm">
            Sign In
          </Button>
        </Link>
      </nav>
    </div>
  );
}
