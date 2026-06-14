"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HardDrive,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PROVIDER_LABELS } from "@/lib/adapters/config";
import type { CloudAccount } from "@/lib/types/database";
import { formatBytes } from "@/lib/utils/format";
import { AllocationSettings } from "@/components/settings/allocation-settings";
import { ConnectAccountDialog } from "@/components/accounts/connect-account-dialog";
import { ProviderConfigPanel } from "@/components/accounts/provider-config-panel";
import { useLanguage } from "@/components/providers/language-provider";

async function fetchAccounts() {
  const response = await fetch("/api/accounts");
  if (!response.ok) throw new Error("Failed to fetch accounts");
  const data = await response.json();
  return data.accounts as CloudAccount[];
}

export function AccountsPanel() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const syncMutation = useMutation({
    mutationFn: async (accountId?: string) => {
      const response = await fetch("/api/sync/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!response.ok) throw new Error("Sync failed");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t("accounts.syncSuccess"));
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => toast.error(t("accounts.syncFailed")),
  });

  async function handleDisconnect(id: string) {
    const response = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      toast.success(t("accounts.disconnectSuccess"));
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("accounts.title")}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t("accounts.subtitle")}</p>
        </div>
        <ConnectAccountDialog
          accounts={accounts}
          onConnected={() => queryClient.invalidateQueries({ queryKey: ["accounts"] })}
        />
      </div>

      <ProviderConfigPanel />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="size-5" />
              {t("accounts.connected")}
            </CardTitle>
            <CardDescription>
              {language === "id"
                ? `${accounts.length} ${t("accounts.connectedDesc")}`
                : `${accounts.length} account${accounts.length !== 1 ? "s" : ""} connected`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate(undefined)}
            disabled={syncMutation.isPending || accounts.length === 0}
          >
            <RefreshCw className={`size-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {t("accounts.syncAll")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground">{t("accounts.loading")}</p>
          )}
          {!isLoading && accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("accounts.empty")}</p>
          )}
          {accounts.map((account) => {
            const usagePercent =
              account.quota_total > 0
                ? Math.round((account.quota_used / account.quota_total) * 100)
                : 0;

            return (
              <div
                key={account.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-2 flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{account.label}</span>
                    <Badge variant="outline">
                      {PROVIDER_LABELS[account.provider]}
                    </Badge>
                    <Badge
                      variant={account.status === "active" ? "default" : "destructive"}
                    >
                      {account.status}
                    </Badge>
                  </div>
                  {account.email && (
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                  )}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {formatBytes(account.quota_used)} / {formatBytes(account.quota_total)}
                      </span>
                      <span>{usagePercent}%</span>
                    </div>
                    <Progress value={usagePercent} />
                  </div>
                  {account.last_synced_at && (
                    <p className="text-xs text-muted-foreground">
                      {t("accounts.lastSynced")}: {new Date(account.last_synced_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => syncMutation.mutate(account.id)}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDisconnect(account.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AllocationSettings accounts={accounts} />
    </div>
  );
}
