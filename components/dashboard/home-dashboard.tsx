"use client";

import { useQuery } from "@tanstack/react-query";
import { Cloud, FileText, HardDrive, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { FileExplorer } from "@/components/files/file-explorer";
import { StorageOverview } from "@/components/dashboard/storage-overview";
import type { CloudAccount } from "@/lib/types/database";
import { formatBytes } from "@/lib/utils/format";
import { useLanguage } from "@/components/providers/language-provider";

async function fetchAccounts() {
  const response = await fetch("/api/accounts");
  if (!response.ok) throw new Error("Failed to fetch accounts");
  const data = await response.json();
  return data.accounts as CloudAccount[];
}

function usagePercent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

export function HomeDashboard() {
  const { t } = useLanguage();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const totalUsed = accounts.reduce((sum, a) => sum + a.quota_used, 0);
  const totalCapacity = accounts.reduce((sum, a) => sum + a.quota_total, 0);
  const overallPercent = usagePercent(totalUsed, totalCapacity);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.connectedAccounts")}
            </CardTitle>
            <Cloud className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{accounts.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {accounts.length === 0 && !isLoading ? (
                <Link href="/quota" className="text-primary underline-offset-4 hover:underline">
                  {t("dashboard.connectFirst")}
                </Link>
              ) : (
                t("dashboard.activeProviders")
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.storageUsedTitle")}
            </CardTitle>
            <HardDrive className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatBytes(totalUsed)}</div>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.ofTotal").replace(
                    "{total}",
                    formatBytes(totalCapacity)
                  )}
                </p>
                {totalCapacity > 0 && (
                  <Progress value={overallPercent} className="h-1.5" />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.quickActions")}
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/my-drive">{t("dashboard.browseFiles")}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/quota">
                <RefreshCw className="size-3 mr-1" />
                {t("dashboard.manage")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      )}

      {!isLoading && accounts.length > 0 && <StorageOverview accounts={accounts} />}

      {!isLoading && (
        <div>
          <h3 className="text-lg font-medium mb-4">{t("dashboard.recentFiles")}</h3>
          <FileExplorer
            queryKey="home-recent"
            fetchUrl="/api/files?recent=1"
            showProvider
            emptyMessage={t("dashboard.recentEmpty")}
          />
        </div>
      )}
    </div>
  );
}
