import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckCircle,
  Archive,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Bell,
  HelpCircle,
  X,
  ChevronRight,
  User,
  Star,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({
  currentTheme,
  onThemeChange,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const menuItems = [
    { id: "/", icon: LayoutDashboard, label: "Home" },
    { id: "/users", icon: Users, label: "Users" },
    { id: "/approvals", icon: CheckCircle, label: "Approvals", badge: true },
    { id: "/itinerary", icon: FileText, label: "Itinerary" },
    { id: "/bookings", icon: Calendar, label: "Bookings" },
    { id: "/history", icon: Archive, label: "History" },
    { id: "/inquiries", icon: HelpCircle, label: "Inquiries" },
    { id: "/feedback", icon: MessageSquare, label: "Feedback" },
  ];

  // Refs for menu overlays
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when navigating or clicking outside
  const handleNavigate = (path: string) => {
    setShowUserMenu(false);
    setShowNotificationMenu(false);
    setShowThemeMenu(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setShowNotificationMenu(false);
      }
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setShowThemeMenu(false);
      }
    };

    if (showUserMenu || showNotificationMenu || showThemeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu, showNotificationMenu, showThemeMenu]);

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center shadow-[0_0_20px_rgba(0,0,0,0.03)] z-50 transition-transform duration-300 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mountain Logo Brand Button */}
        <button
          onClick={() => handleNavigate("/")}
          className="mt-5 mb-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 hover:rotate-2"
          style={{
            background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))`,
            boxShadow: `0 4px 12px var(--shadow-color-strong)`,
          }}
        >
          <svg viewBox="0 0 200 120" width="32" height="32">
            <path
              d="M 10 110 L 70 10 L 100 60 L 130 10 L 190 110 Z"
              fill="white"
            />
            <circle cx="100" cy="75" r="12" fill="white" opacity="0.9" />
          </svg>
        </button>

        {/* Navigation Menu Items */}
        <div className="flex flex-col items-center gap-1 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.id ||
              (item.id === "/itinerary" &&
                location.pathname.startsWith("/itinerary"));

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`
                relative w-16 h-[72px] rounded-xl flex flex-col items-center justify-center gap-1.5
                transition-all duration-200 hover:-translate-y-0.5
                ${
                  isActive
                    ? "bg-sidebar-accent border-l-[3px] border-sidebar-primary"
                    : "hover:bg-sidebar-accent/50"
                }
              `}
                style={
                  isActive
                    ? {
                        boxShadow: `0 0 0 3px var(--shadow-color)`,
                      }
                    : undefined
                }
              >
                <div
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${
                    isActive ? "" : "group-hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/60"
                    } transition-colors`}
                    strokeWidth={2.5}
                  />
                </div>
                <span
                  className={`text-[10.5px] ${
                    isActive
                      ? "text-sidebar-primary font-semibold"
                      : "text-sidebar-foreground/60 font-medium"
                  } tracking-tight transition-all`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-warning rounded-full border-2 border-sidebar" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section - More Menu, Notification, User Avatar */}
        <div className="mt-auto mb-3 flex flex-col items-center gap-2">
          {/* More Menu Button */}
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-14 h-14 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent flex items-center justify-center transition-all duration-200 hover:scale-105 relative"
          >
            <MoreHorizontal
              className="w-5 h-5 text-sidebar-foreground/60"
              strokeWidth={2.5}
            />
          </button>

          {/* Notification Bell Button */}
          <button
            onClick={() => {
              setShowNotificationMenu(false);
              setShowUserMenu(false);
              setShowThemeMenu(false);
              handleNavigate("/notifications");
            }}
            className="w-14 h-14 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent flex items-center justify-center transition-all duration-200 hover:scale-105 relative group"
          >
            <Bell
              className="w-5 h-5 text-sidebar-foreground/60 group-hover:animate-[wiggle_0.5s_ease-in-out]"
              strokeWidth={2.5}
            />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-sidebar" />
          </button>

          {/* User Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">A</span>
          </div>
        </div>

        {/* User Menu Overlay */}
        {showUserMenu && (
          <div
            ref={userMenuRef}
            className="fixed bottom-3 left-24 w-72 max-w-[calc(100vw-6rem)] bg-popover backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(10,122,255,0.12),0_2px_8px_rgba(0,0,0,0.08)] border border-border z-[200] overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <User className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base text-popover-foreground">Admin</h3>
                  <p className="text-sm text-muted-foreground">
                    admin@bondvoyage.com
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => handleNavigate("/profile/edit")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <User className="w-4 h-4 text-primary" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-popover-foreground">
                    Edit Profile
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Manage account settings
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-popover-foreground transition-colors" />
              </button>

              <button
                onClick={() => {
                  setShowThemeMenu(!showThemeMenu);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                  {currentTheme === "dark" ? (
                    <Moon className="w-4 h-4 text-warning" strokeWidth={2} />
                  ) : (
                    <Sun className="w-4 h-4 text-warning" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-popover-foreground">Theme</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {currentTheme} mode
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-popover-foreground transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* Theme Menu Overlay - Positioned to the right of User Menu */}
        {showThemeMenu && (
          <div
            ref={themeMenuRef}
            className="fixed bottom-3 left-24 lg:left-[400px] w-80 max-w-[calc(100vw-6rem)] bg-popover backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(10,122,255,0.12),0_2px_8px_rgba(0,0,0,0.08)] border border-border z-[200] overflow-hidden"
          >
            <div className="p-5 border-b border-border bg-gradient-to-br from-warning/5 to-warning/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center shadow-md">
                  {currentTheme === "dark" ? (
                    <Moon className="w-6 h-6 text-white" strokeWidth={2} />
                  ) : (
                    <Sun className="w-6 h-6 text-white" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-base text-popover-foreground">
                    Theme Settings
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Customize your experience
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3">
              {/* Light Theme */}
              <button
                onClick={() => {
                  onThemeChange("light");
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all group ${
                  currentTheme === "light"
                    ? "bg-primary/10 border-2 border-primary"
                    : "hover:bg-accent/50 border-2 border-transparent"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                    currentTheme === "light"
                      ? "bg-primary/20"
                      : "bg-muted group-hover:bg-muted/80"
                  }`}
                >
                  <Sun
                    className={`w-5 h-5 ${
                      currentTheme === "light"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={`text-sm font-medium ${
                      currentTheme === "light"
                        ? "text-primary"
                        : "text-popover-foreground"
                    }`}
                  >
                    Light
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bright and clean interface
                  </p>
                </div>
                {currentTheme === "light" && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>

              {/* Dark Theme */}
              <button
                onClick={() => {
                  onThemeChange("dark");
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all group mt-2 ${
                  currentTheme === "dark"
                    ? "bg-primary/10 border-2 border-primary"
                    : "hover:bg-accent/50 border-2 border-transparent"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                    currentTheme === "dark"
                      ? "bg-primary/20"
                      : "bg-muted group-hover:bg-muted/80"
                  }`}
                >
                  <Moon
                    className={`w-5 h-5 ${
                      currentTheme === "dark"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={`text-sm font-medium ${
                      currentTheme === "dark"
                        ? "text-primary"
                        : "text-popover-foreground"
                    }`}
                  >
                    Dark
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reduced eye strain at night
                  </p>
                </div>
                {currentTheme === "dark" && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>

            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Theme preference is saved automatically
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
