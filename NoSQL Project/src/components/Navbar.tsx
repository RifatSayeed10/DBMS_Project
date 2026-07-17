import React from "react";
import { 
  BookOpen, LogOut, ShieldAlert, Landmark, MessageSquare, Menu, X, User,
  Sun, Moon
} from "lucide-react";
import { User as UserType, SiteBranding } from "../types";

interface NavbarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  currentUser: UserType | null;
  onLogout: () => void;
  branding: SiteBranding | null;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export default function Navbar({
  currentTab,
  onChangeTab,
  currentUser,
  onLogout,
  branding,
  theme = "light",
  onToggleTheme
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [useFallbackLogo, setUseFallbackLogo] = React.useState(false);

  const menuItems = [
    { id: "home", label: "Home" },
    { id: "papers", label: "Papers Library" },
    { id: "topics", label: "Trending Topics" },
    { id: "researchers", label: "Researchers" },
  ];

  const adminMenuVisible = currentUser && (currentUser.role === "admin" || currentUser.role === "editor");

  const siteTitle = branding?.siteName || "Research Archive";
  const tagline = branding?.siteTagline || "Open Repository";
  const logoUrl = branding?.logoUrl || "";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md" id="archive-navbar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo & Dynamic Branding Section */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                onChangeTab("home");
                setMobileOpen(false);
              }}
              className="flex items-center gap-2.5 text-left transition-transform active:scale-95 cursor-pointer"
              id="navbar-logo"
            >
              {logoUrl && !useFallbackLogo ? (
                <img 
                  src={logoUrl} 
                  alt={siteTitle} 
                  referrerPolicy="no-referrer"
                  onError={() => setUseFallbackLogo(true)}
                  className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                  <BookOpen className="h-5.5 w-5.5 text-white" />
                </div>
              )}
              
              <div>
                <span className="block font-display text-base font-bold tracking-tight text-slate-900 leading-none">
                  {siteTitle}
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-400 mt-1">
                  {tagline}
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-1.5">
              {menuItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => {
                      onChangeTab(item.id);
                      setMobileOpen(false);
                    }}
                    className={`rounded-lg px-3 py-1.5 font-sans text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-slate-100 text-slate-900 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              {adminMenuVisible && (
                <button
                  id="nav-tab-admin"
                  onClick={() => {
                    onChangeTab("admin");
                    setMobileOpen(false);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 hover:bg-amber-100 cursor-pointer transition`}
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Admin Office Tab
                </button>
              )}
            </div>
          </div>

          {/* User Section & Mobile Actions */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="hidden items-center gap-4 md:flex">
                
                {/* Scholar Chat link */}
                <button
                  id="nav-chat-indicator"
                  onClick={() => onChangeTab("chat")}
                  className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 border transition-all text-slate-600 cursor-pointer ${
                    currentTab === "chat" 
                      ? "bg-violet-50 text-violet-700 border-violet-100 shadow-xs" 
                      : "bg-slate-50/50 border-transparent hover:bg-slate-100"
                  }`}
                  title="Scholarly Messages"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-650 transition-colors" />
                  <span className="font-mono text-xs font-bold">
                    Live Chat
                  </span>
                </button>

                {/* Profile Dashboard link */}
                <button
                  id="nav-bookmarks-indicator"
                  onClick={() => onChangeTab("profile")}
                  className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 border transition-all text-slate-600 cursor-pointer ${
                    currentTab === "profile" 
                      ? "bg-violet-50 text-violet-700 border-violet-100 shadow-xs" 
                      : "bg-slate-50/50 border-transparent hover:bg-slate-100"
                  }`}
                  title="My Dashboard & Downloads"
                >
                  <Landmark className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-650 transition-colors" />
                  <span className="font-mono text-xs font-bold">
                    My Account
                  </span>
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="text-right select-none">
                    <span className="block text-xs font-semibold text-slate-800 leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase leading-none mt-0.5">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-signout"
                  onClick={onLogout}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-red-600 transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                  title="Close session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-3 md:flex">
                <button
                  id="nav-btn-signin"
                  onClick={() => onChangeTab("signin")}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="nav-btn-register"
                  onClick={() => onChangeTab("register")}
                  className="rounded-full bg-slate-900 hover:bg-slate-850 px-4 py-2 font-sans text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="hidden md:flex rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-violet-600 transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                title="Toggle Light / Dark Mode"
                id="navbar-theme-toggle"
              >
                {theme === "light" ? (
                  <Moon className="h-4.5 w-4.5 text-violet-600" />
                ) : (
                  <Sun className="h-4.5 w-4.5 text-amber-500" />
                )}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden transition-all cursor-pointer"
              id="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white shadow-inner md:hidden" id="mobile-menu-drawer">
          <div className="space-y-1.5 px-4.5 py-4">
            {menuItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-violet-50 text-violet-700 font-bold border-l-4 border-violet-500"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {adminMenuVisible && (
              <button
                onClick={() => {
                  onChangeTab("admin");
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 border border-amber-100 cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Admin Office Dashboard
              </button>
            )}

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex w-full items-center gap-2 rounded-lg bg-slate-50 border border-slate-150 px-4 py-2.5 text-slate-700 font-bold text-xs cursor-pointer mt-1"
                id="mobile-theme-toggle"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-4 w-4 text-violet-600" />
                    <span>Switch to Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span>Switch to Light Mode</span>
                  </>
                )}
              </button>
            )}

            <hr className="my-3 border-slate-100" />

            {currentUser ? (
              <div className="space-y-3">
                
                {/* Live Chat in Mobile */}
                <button
                  onClick={() => {
                    onChangeTab("chat");
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg bg-violet-50 border border-violet-100 px-4 py-2.5 text-violet-800 font-bold text-xs cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 text-violet-500" />
                  Live Scholar Chat
                </button>

                {/* Profile Dashboard in Mobile */}
                <button
                  onClick={() => {
                    onChangeTab("profile");
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg bg-slate-50 border border-slate-150 px-4 py-2.5 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  <Landmark className="h-4 w-4 text-violet-500" />
                  My Dashboard & Unlocks
                </button>

                <div className="flex items-center gap-3 px-3 py-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">
                      {currentUser.name}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400 font-semibold capitalize mt-0.5">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2 select-none">
                <button
                  onClick={() => {
                    onChangeTab("signin");
                    setMobileOpen(false);
                  }}
                  className="rounded-full border border-slate-200 py-2 text-center text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onChangeTab("register");
                    setMobileOpen(false);
                  }}
                  className="rounded-full bg-slate-900 py-2 text-center text-xs font-bold text-white cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
