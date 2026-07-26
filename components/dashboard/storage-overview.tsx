"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PROVIDER_LABELS } from "@/lib/adapters/config";
import type { CloudAccount } from "@/lib/types/database";
import { getAccountDisplayName } from "@/lib/utils/account-display";
import { formatBytes } from "@/lib/utils/format";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

function usagePercent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

interface StorageOverviewProps {
  accounts: CloudAccount[];
}

export function StorageOverview({ accounts }: StorageOverviewProps) {
  const { t } = useLanguage();

  const sorted = [...accounts].sort((a, b) => {
    if (a.provider !== b.provider) {
      return PROVIDER_LABELS[a.provider].localeCompare(PROVIDER_LABELS[b.provider]);
    }
    return getAccountDisplayName(a).localeCompare(getAccountDisplayName(b));
  });

  const totalUsed = accounts.reduce((sum, a) => sum + a.quota_used, 0);
  const totalCapacity = accounts.reduce((sum, a) => sum + a.quota_total, 0);
  const overallPercent = usagePercent(totalUsed, totalCapacity);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.storageChartTitle")}</CardTitle>
        <CardDescription>{t("dashboard.storageChartDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t("dashboard.storageAllAccounts")}</span>
            <span className="tabular-nums font-medium">
              {formatBytes(totalUsed)} / {formatBytes(totalCapacity)}
              <span className="text-muted-foreground font-normal ml-2">
                ({overallPercent}%)
              </span>
            </span>
          </div>
          <Progress value={overallPercent} className="h-2.5" />
        </div>

        <Separator />

        <ul className="space-y-5">
          {sorted.map((account) => {
            const percent = usagePercent(account.quota_used, account.quota_total);
            const free = Math.max(0, account.quota_total - account.quota_used);
            const isError = account.status === "error";

            return (
              <li key={account.id} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="font-medium truncate">
                    {getAccountDisplayName(account)}
                  </span>
                  <Badge variant="secondary">
                    {PROVIDER_LABELS[account.provider]}
                  </Badge>
                  {isError && (
                    <Badge variant="destructive">{t("accounts.statusError")}</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {formatBytes(account.quota_used)} / {formatBytes(account.quota_total)}
                  </span>
                  <span className="tabular-nums shrink-0">
                    {t("dashboard.storageFree")}: {formatBytes(free)} · {percent}%
                  </span>
                </div>

                <Progress
                  value={percent}
                  className={cn("h-2", percent >= 90 && "[&>div]:bg-destructive")}
                />
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted-foreground">
          <Link href="/quota" className="text-primary underline-offset-4 hover:underline">
            {t("dashboard.manageAccounts")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
