import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  Heart,
  ShoppingCart,
  Shield,
  Bell,
  MessageSquare,
  HelpCircle,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Gift,
  type LucideIcon,
} from "lucide-react";
import { DarkModeToggle } from "../dark-mode-toggle";
import { motion } from "motion/react";
import { PortalScrollNav } from "../ui/portal-scroll-nav";
import { PortalSidebarBackdrop } from "../ui/portal-sidebar-backdrop";
import { usePortalSidebar } from "../ui/use-portal-sidebar";
import { useAuth, useLogout } from "../auth-context";
import { toast } from "sonner";
import { MessagesProvider, useMessages } from "./messages-context";
import { NotificationsProvider, useNotifications } from "./notifications-context";
import { updateMeProfile } from "@/lib/auth-api";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Compare Policies", path: "/dashboard/compare" },
  { icon: Heart, label: "Saved Policies", path: "/dashboard/saved" },
  { icon: ShoppingCart, label: "My Purchases", path: "/dashboard/purchases" },
  { icon: Shield, label: "Claims", path: "/dashboard/claims" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
  { icon: MessageSquare, label: "Messages", path: "/dashboard/messages" },
  { icon: HelpCircle, label: "Support", path: "/dashboard/support" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const REFERRAL_MESSAGE =
  "Join me on ClearClever to compare insurance in one place. New users get a joining reward with specialized insurance offers, discounts, and useful add-ons. Try it here: https://clearclever.vercel.app";

export function PolicySeekerDashboard() {
  return (
    <NotificationsProvider>
      <MessagesProvider>
        <PolicySeekerDashboardInner />
      </MessagesProvider>
    </NotificationsProvider>
  );
}

function PolicySeekerDashboardInner() {
  const { isNarrow, sidebarOpen, closeSidebar, openSidebar, sidebarMotionWidth } =
    usePortalSidebar(280);
  const location = useLocation();
  const handleLogout = useLogout();
  const { user, userName, userEmail, refreshUser } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadCount: unreadMessagesCount } = useMessages();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const isDashboardHome = location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  useEffect(() => {
    setProfilePhoto(user?.profile?.profilePhotoDataUrl ?? null);
  }, [user?.id, user?.profile?.profilePhotoDataUrl]);

  const isActive = useCallback(
    (path: string) => {
      if (path === "/dashboard") {
        return location.pathname === "/dashboard" || location.pathname === "/dashboard/";
      }
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  const navItems = useMemo(
    () =>
      menuItems.map((item) => ({
        ...item,
        badge:
          item.path === "/dashboard/notifications"
            ? unreadCount || undefined
            : item.path === "/dashboard/messages"
              ? unreadMessagesCount || undefined
              : undefined,
      })),
    [unreadCount, unreadMessagesCount]
  );

  const handleProfilePhotoUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photo must be under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const nextPhoto = String(reader.result);
      setProfilePhoto(nextPhoto);
      try {
        await updateMeProfile({ profilePhotoDataUrl: nextPhoto });
        await refreshUser();
        toast.success("Profile photo updated");
      } catch {
        toast.error("Could not save profile photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const shareReferral = () => {
    void navigator.clipboard?.writeText(REFERRAL_MESSAGE).catch(() => undefined);
    toast.message("Invite message ready", {
      description: "Opening your messages app. The invite text was also copied.",
    });
  };

  return (
    <motion.div className="min-h-screen flex bg-background overflow-x-hidden">
        <PortalSidebarBackdrop open={isNarrow && sidebarOpen} onClose={closeSidebar} />
        <motion.aside
          initial={false}
          animate={{ width: sidebarMotionWidth }}
          transition={{ duration: 0.3 }}
          className={`bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden shrink-0 ${
            isNarrow ? "fixed inset-y-0 left-0 z-50 h-screen shadow-2xl" : "sticky top-0 h-screen"
          }`}
        >
          <div className="w-[280px] flex flex-col h-full">
            <div className="p-6 border-b border-sidebar-border flex items-center justify-between gap-2">
              <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg font-[Poppins] truncate">ClearClever</span>
              </Link>
              {sidebarOpen ? (
                <button
                  type="button"
                  onClick={closeSidebar}
                  className="p-2 hover:bg-sidebar-accent rounded-xl transition-colors shrink-0"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : null}
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 min-h-0">
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block"
                      onClick={() => isNarrow && closeSidebar()}
                    >
                      <div
                        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                          active
                            ? "text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`}
                      >
                        {active ? (
                          <motion.span
                            layoutId="seeker-sidebar-active"
                            className="absolute inset-0 rounded-xl bg-sidebar-accent"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        ) : null}
                        <motion.span whileHover={{ scale: 1.1 }} className="relative z-[1] shrink-0">
                        <Icon
                          className={`w-5 h-5 ${
                            active ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                          }`}
                        />
                        </motion.span>
                        <span className="relative z-[1] flex-1">{item.label}</span>
                        {item.path === "/dashboard/notifications" && unreadCount > 0 ? (
                          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                            {unreadCount}
                          </span>
                        ) : null}
                        {item.path === "/dashboard/messages" && unreadMessagesCount > 0 ? (
                          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                            {unreadMessagesCount}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <a
                href={`sms:?&body=${encodeURIComponent(REFERRAL_MESSAGE)}`}
                onClick={shareReferral}
                className="mt-6 block rounded-2xl border border-success/25 bg-success/10 p-4 text-sidebar-foreground hover:bg-success/15 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success text-white flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Refer & earn</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Invite friends and unlock insurance discounts or add-ons.
                    </p>
                    <span className="mt-3 inline-flex text-xs font-medium text-success">
                      Invite now →
                    </span>
                  </div>
                </div>
              </a>
            </nav>

            <div className="p-4 border-t border-sidebar-border mt-auto shrink-0">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-sidebar-accent/40">
                <ProfilePhotoPicker
                  id="sidebar-profile-photo"
                  photo={profilePhoto}
                  sizeClass="w-14 h-14"
                  onUpload={handleProfilePhotoUpload}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{userName ?? "Policy seeker"}</div>
                  <div className="text-xs text-muted-foreground truncate">{userEmail ?? ""}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4 min-w-0">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                {!sidebarOpen ? (
                  <button
                    type="button"
                    onClick={openSidebar}
                    className="p-2 hover:bg-accent rounded-xl transition-colors shrink-0"
                    aria-label="Open navigation"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                ) : null}
                {!isDashboardHome && (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-2.5 py-2 sm:px-3 rounded-xl border border-border text-sm hover:bg-accent transition-colors min-w-0"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Back to dashboard</span>
                    <span className="sm:hidden truncate">Back</span>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2 text-success">
                  <div className="w-7 h-7 rounded-lg bg-success text-white flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold">Your data is secure</p>
                    <p className="text-[10px] text-muted-foreground">256-bit encryption</p>
                  </div>
                </div>
                <Link
                  to="/dashboard/notifications"
                  className="relative p-2 hover:bg-accent rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                  ) : null}
                </Link>
                <DarkModeToggle />
                <div className="hidden sm:block">
                  <ProfilePhotoPicker
                    id="header-profile-photo"
                    photo={profilePhoto}
                    sizeClass="w-12 h-12"
                    onUpload={handleProfilePhotoUpload}
                  />
                </div>
              </div>
            </div>
          </header>

          <PortalScrollNav
            items={navItems}
            isActive={isActive}
            theme="seeker"
            layoutId="seeker-top-nav-active"
          />

          <main
            className={`flex-1 min-w-0 p-4 sm:p-6 ${
              location.pathname.includes("/messages") || location.pathname.includes("/support")
                ? "flex flex-col min-h-0 overflow-hidden"
                : "overflow-y-auto overflow-x-hidden"
            }`}
          >
            <Outlet />
          </main>
        </div>
    </motion.div>
  );
}

function ProfilePhotoPicker({
  id,
  photo,
  sizeClass,
  onUpload,
}: {
  id: string;
  photo: string | null;
  sizeClass: string;
  onUpload: (file: File | undefined) => void;
}) {
  return (
    <motion.div className={`relative ${sizeClass} shrink-0`}>
      <label
        htmlFor={id}
        className={`relative ${sizeClass} rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border border-border`}
        title="Upload profile photo"
      >
        {photo ? (
          <img src={photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
        ) : (
          <User className="w-6 h-6 text-muted-foreground" />
        )}
        <input
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => onUpload(event.target.files?.[0])}
        />
      </label>
    </motion.div>
  );
}
