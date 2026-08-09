"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Clock,
  Cloud,
  HardDrive,
  Home,
  Loader2,
  LogOut,
  Settings,
  Share2,
  Star,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SamarLogo } from "@/components/brand/samar-logo";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { titleKey: "nav.home" as const, href: "/", icon: Home },
  { titleKey: "nav.myDrive" as const, href: "/my-drive", icon: HardDrive },
  { titleKey: "nav.recent" as const, href: "/recent", icon: Clock },
  { titleKey: "nav.starred" as const, href: "/starred", icon: Star },
  { titleKey: "nav.shared" as const, href: "/shared-with-me", icon: Share2 },
  { titleKey: "nav.storage" as const, href: "/quota", icon: Cloud },
  { titleKey: "nav.settings" as const, href: "/settings", icon: Settings },
];

const helpNavItems = [
  { titleKey: "nav.connectGuide" as const, href: "/connect-guide", icon: BookOpen },
];

type SidebarNavItem = (typeof navItems | typeof helpNavItems)[number];

interface AppSidebarProps {
  userEmail?: string | null;
  pendingHref: string | null;
  onNavigate: (href: string) => void;
}

function AppSidebarNav({
  items,
  pendingHref,
  onNavigate,
}: {
  items: SidebarNavItem[];
  pendingHref: string | null;
  onNavigate: (href: string) => void;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = pathname === item.href;
        const isPending = pendingHref === item.href && !isActive;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive || isPending}>
              <Link
                href={item.href}
                onClick={() => {
                  if (pathname !== item.href) onNavigate(item.href);
                }}
              >
                <item.icon
                  className={cn("size-4", isPending && "opacity-80")}
                />
                <span className={cn(isPending && "opacity-80")}>
                  {t(item.titleKey)}
                </span>
                {isPending ? (
                  <Loader2 className="ml-auto size-3.5 shrink-0 animate-spin opacity-80" />
                ) : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function SignOutButton() {
  const { t } = useLanguage();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
      <LogOut className="size-4 mr-2" />
      {t("nav.signOut")}
    </Button>
  );
}

export function AppSidebar({
  userEmail,
  pendingHref,
  onNavigate,
}: AppSidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link
          href="/"
          className="flex items-center"
          aria-label="SamarCloud"
          onClick={() => {
            if (pathname !== "/") onNavigate("/");
          }}
        >
          <SamarLogo variant="lockup" height={32} className="max-w-full" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <AppSidebarNav
              items={navItems}
              pendingHref={pendingHref}
              onNavigate={onNavigate}
            />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.help")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <AppSidebarNav
              items={helpNavItems}
              pendingHref={pendingHref}
              onNavigate={onNavigate}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {userEmail && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 truncate">
            <User className="size-3 shrink-0" />
            <span className="truncate">{userEmail}</span>
          </div>
        )}
        <SignOutButton />
      </SidebarFooter>
    </Sidebar>
  );
}

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const isNavigating = pendingHref !== null && pendingHref !== pathname;

  return (
    <SidebarProvider>
      <AppSidebar
        userEmail={userEmail}
        pendingHref={pendingHref}
        onNavigate={setPendingHref}
      />
      <main className="relative flex min-h-screen flex-1 flex-col">
        {isNavigating ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-primary/15"
            aria-hidden
          >
            <div className="h-full w-1/3 animate-navigation-progress bg-primary" />
          </div>
        ) : null}
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{t("header.subtitle")}</span>
          {isNavigating ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : null}
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
