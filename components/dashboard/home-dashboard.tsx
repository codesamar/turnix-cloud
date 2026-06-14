"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Cloud, FileText, HardDrive, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileExplorer } from "@/components/files/file-explorer";
import {
  StorageChartTooltip,
  type StorageChartRow,
} from "@/components/dashboard/storage-chart-tooltip";
import { getAccountDisplayName } from "@/lib/utils/account-display";
import type { CloudAccount } from "@/lib/types/database";
import { formatBytes } from "@/lib/utils/format";
import { useLanguage } from "@/components/providers/language-provider";

async function fetchAccounts() {
  const response = await fetch("/api/accounts");
  if (!response.ok) throw new Error("Failed to fetch accounts");
  const data = await response.json();
  return data.accounts as CloudAccount[];
}

function toGb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024 * 1024)) * 10) / 10;
}

export function HomeDashboard() {
  const { t } = useLanguage();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const totalUsed = accounts.reduce((sum, a) => sum + a.quota_used, 0);
  const totalCapacity = accounts.reduce((sum, a) => sum + a.quota_total, 0);

  const chartData: StorageChartRow[] = accounts.map((account) => {
    const used = toGb(account.quota_used);
    const total = toGb(account.quota_total);
    const free = Math.max(0, Math.round((total - used) * 10) / 10);
    const usedPercent = total > 0 ? Math.round((used / total) * 100) : 0;

    return {
      name: getAccountDisplayName(account),
      used,
      free,
      total,
      usedPercent,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your unified cloud storage
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Cloud className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {accounts.length === 0 ? (
                <Link href="/quota" className="text-primary underline-offset-4 hover:underline">
                  Connect your first account
                </Link>
              ) : (
                "Active cloud providers"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalUsed)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatBytes(totalCapacity)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/my-drive">Browse Files</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/quota">
                <RefreshCw className="size-3 mr-1" />
                Manage
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.storageChartTitle")}</CardTitle>
            <CardDescription>{t("dashboard.storageChartDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "GB",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
                  }}
                />
                <Tooltip
                  content={<StorageChartTooltip />}
                  cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                />
                <Legend
                  formatter={(value) =>
                    value === "used" ? t("dashboard.legendUsed") : t("dashboard.legendFree")
                  }
                />
                <Bar
                  dataKey="used"
                  stackId="storage"
                  fill="hsl(var(--primary))"
                  name="used"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="free"
                  stackId="storage"
                  fill="hsl(var(--muted))"
                  name="free"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <div>
          <h3 className="text-lg font-medium mb-4">Recent Files</h3>
          <FileExplorer
            queryKey="home-recent"
            fetchUrl="/api/files?recent=1"
            showProvider
            emptyMessage="No recent files. Sync your accounts to see activity."
          />
        </div>
      )}
    </div>
  );
}
