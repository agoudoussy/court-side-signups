import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, Settings, MessageSquare,
  Menu, X, LogOut, ChevronRight, Users, CreditCard,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import raidersLogo from "@/assets/raiders-logo.png";
import Portal from "./Portal";

const NAV = [
  { to: "/admin",           icon: LayoutDashboard, label: "Dashboard",      end: true },
  { to: "/admin/dossiers",  icon: FolderOpen,      label: "Dossiers" },
  { to: "/admin/payments",  icon: CreditCard,      label: "Paiements" },
  { to: "/admin/parents",   icon: Users,           label: "Parents" },
  { to: "/admin/messages",  icon: MessageSquare,   label: "Communications" },
  { to: "/admin/config",    icon: Settings,        label: "Configuration" },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="bg-white rounded-xl p-1.5 shrink-0">
          <img src={raidersLogo} alt="Raiders" className="h-8 w-auto object-contain" />
        </div>
        <div>
          <p className="font-display text-white text-base leading-none tracking-wide">RAIDERS</p>
          <p className="text-[10px] text-white/40 tracking-widest uppercase mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${isActive
                ? "bg-primary/15 text-primary font-medium"
                : "text-white/55 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-primary/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
        <div className="px-3 py-2">
          <p className="text-[11px] text-white/35 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/55 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/10">
        <Sidebar />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <Portal>
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative w-60 flex flex-col border-r border-white/10">
              <Sidebar />
            </aside>
          </div>
        </Portal>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 bg-background border-b border-border flex items-center px-5 gap-4 shrink-0">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary uppercase">
              {user?.email?.[0] ?? "A"}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
