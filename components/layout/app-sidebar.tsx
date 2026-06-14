"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  Cloud,
  HardDrive,
  Home,
  LogOut,
  Settings,
  Share2,
  Star,
  User,
} from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/providers/language-provider";

const navItems = [
  { titleKey: "nav.home" as const, href: "/", icon: Home },
  { titleKey: "nav.myDrive" as const, href: "/my-drive", icon: HardDrive },
  { titleKey: "nav.recent" as const, href: "/recent", icon: Clock },
  { titleKey: "nav.starred" as const, href: "/starred", icon: Star },
  { titleKey: "nav.shared" as const, href: "/shared-with-me", icon: Share2 },
  { titleKey: "nav.storage" as const, href: "/quota", icon: Cloud },
  { titleKey: "nav.settings" as const, href: "/settings", icon: Settings },
];

interface AppSidebarProps {
  userEmail?: string | null;
}

function AppSidebarNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={pathname === item.href}>
            <Link href={item.href}>
              <item.icon className="size-4" />
              <span>{t(item.titleKey)}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
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

export function AppSidebar({ userEmail }: AppSidebarProps) {
  const { t } = useLanguage();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Cloud className="size-5 text-primary" />
          <span>TurnixCloud</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <AppSidebarNav />
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

  return (
    <SidebarProvider>
      <AppSidebar userEmail={userEmail} />
      <main className="flex flex-1 flex-col min-h-screen">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{t("header.subtitle")}</span>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
