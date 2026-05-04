import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.jpeg";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/recommend", label: "Analyze" },
  { to: "/rainfall", label: "Rainfall" },
  { to: "/history", label: "History" },
  { to: "/help", label: "Help" },
  { to: "/about", label: "About" },
];

export default function NavHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
   const { lang, t, toggleLang } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container max-w-6xl flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="NthakaGuide logo" className="h-8 w-8 rounded-md object-cover" />
          <span className="font-display font-bold text-foreground text-lg">NthakaGuide</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm font-semibold ${
                  pathname === link.to ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
          
          {user ? (
            <>
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm font-semibold ${
                    pathname === "/profile" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserRound className="h-4 w-4 mr-1" /> Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-1" /> Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-golden text-golden-foreground hover:bg-golden/90 font-semibold text-sm ml-2">
                Sign In
              </Button>
            </Link>
          )}
        </nav>

        <Button variant="ghost" size="sm" className="sm:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <nav className="sm:hidden border-t border-border bg-card px-4 py-2 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm font-semibold ${
                  pathname === link.to ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sm font-semibold ${
                    pathname === "/profile" ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
                >
                  <UserRound className="h-4 w-4 mr-2" /> Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => { handleSignOut(); setOpen(false); }}
                className="w-full justify-start text-sm font-semibold text-muted-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)}>
              <Button className="w-full bg-golden text-golden-foreground hover:bg-golden/90 font-semibold text-sm">
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
