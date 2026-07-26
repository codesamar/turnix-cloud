"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HardDrive,
  Link2,
  RefreshCw,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OAUTH_PROVIDERS, PROVIDER_LABELS } from "@/lib/adapters/config";
import { getAccountDisplayName } from "@/lib/utils/account-display";
import type { CloudAccount, CloudProvider } from "@/lib/types/database";
import { formatBytes } from "@/lib/utils/format";
import { AllocationSettings } from "@/components/settings/allocation-settings";
import { ConnectAccountDialog } from "@/components/accounts/connect-account-dialog";
import { ProviderConfigPanel } from "@/components/accounts/provider-config-panel";
import { useLanguage } from "@/components/providers/language-provider";
import { invalidateFileQueries } from "@/lib/utils/invalidate-file-queries";
import type { ProviderStatus } from "@/lib/services/provider-config";
import { isTokenExpiredError } from "@/lib/utils/account-error";
import { isOAuthMessage, openOAuthPopup } from "@/lib/oauth/popup";
import { cn } from "@/lib/utils";

type ConfirmAction =
  | { type: "sync-all" }
  | { type: "sync"; account: CloudAccount }
  | { type: "disconnect"; account: CloudAccount };

async function fetchAccounts() {
  const response = await fetch("/api/accounts");
  if (!response.ok) throw new Error("Failed to fetch accounts");
  const data = await response.json();
  return data.accounts as CloudAccount[];
}

async function fetchProviders() {
  const response = await fetch("/api/providers");
  if (!response.ok) throw new Error("Failed to fetch providers");
  const data = await response.json();
  return data.providers as ProviderStatus[];
}

export function AccountsPanel() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [reconnectingProvider, setReconnectingProvider] =
    useState<CloudProvider | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const popupPollRef = useRef<number | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
  });

  const hasConfiguredProvider = providers.some(
    (provider) =>
      provider.configured &&
      (provider.provider === "s3" ||
        provider.provider === "terabox" ||
        OAUTH_PROVIDERS.includes(provider.provider))
  );

  function clearPopupPoll() {
    if (popupPollRef.current !== null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  }

  function refreshAccounts() {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    invalidateFileQueries(queryClient);
  }

  useEffect(() => {
    function handleOAuthMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!isOAuthMessage(event.data)) return;

      clearPopupPoll();
      setReconnectingProvider(null);

      if (event.data.error) {
        const message =
          event.data.error === "provider_not_configured"
            ? t("providers.notConfiguredError")
            : event.data.error === "oauth_denied"
              ? t("providers.oauthDenied")
              : t("providers.connectFailed");
        toast.error(message);
        if (event.data.error === "provider_not_configured") {
          document.getElementById("provider-config")?.scrollIntoView({
            behavior: "smooth",
          });
        }
        return;
      }

      if (event.data.connected) {
        toast.success(t("providers.connectSuccess"));
        refreshAccounts();
      }
    }

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
      clearPopupPoll();
    };
  }, [queryClient, t]);

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
    onSuccess: (data: {
      results?: Array<{ provider: string; filesSynced: number; error?: string }>;
    }) => {
      const errors = (data.results ?? []).filter((result) => result.error);
      if (errors.length > 0) {
        const friendly = errors.map((result) => {
          const detail = isTokenExpiredError(result.error)
            ? t("accounts.errorTokenExpired")
            : result.error;
          return `${PROVIDER_LABELS[result.provider as CloudProvider] ?? result.provider}: ${detail}`;
        });
        toast.error(friendly.join(" · "));
      } else {
        toast.success(t("accounts.syncSuccess"));
      }
      refreshAccounts();
    },
    onError: () => toast.error(t("accounts.syncFailed")),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accounts?id=${id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || t("accounts.disconnectFailed"));
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["accounts"] });
      const previous = queryClient.getQueryData<CloudAccount[]>(["accounts"]);
      queryClient.setQueryData<CloudAccount[]>(["accounts"], (current) =>
        (current ?? []).filter((account) => account.id !== id)
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["accounts"], context.previous);
      }
      toast.error(
        error instanceof Error ? error.message : t("accounts.disconnectFailed")
      );
    },
    onSuccess: () => {
      toast.success(t("accounts.disconnectSuccess"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["allocation"] });
      invalidateFileQueries(queryClient);
    },
  });

  function runConfirmedAction() {
    const action = confirmAction;
    if (!action) return;

    setConfirmAction(null);

    if (action.type === "sync-all") {
      syncMutation.mutate(undefined);
      return;
    }

    if (action.type === "sync") {
      syncMutation.mutate(action.account.id);
      return;
    }

    disconnectMutation.mutate(action.account.id);
  }

  function confirmDialogCopy() {
    if (!confirmAction) {
      return { title: "", description: "", confirm: "", destructive: false };
    }

    if (confirmAction.type === "sync-all") {
      return {
        title: t("accounts.confirmSyncAllTitle"),
        description: t("accounts.confirmSyncAllDesc"),
        confirm: t("accounts.syncAll"),
        destructive: false,
      };
    }

    const label = getAccountDisplayName(confirmAction.account);
    const provider = PROVIDER_LABELS[confirmAction.account.provider];

    if (confirmAction.type === "sync") {
      return {
        title: t("accounts.confirmSyncTitle"),
        description: t("accounts.confirmSyncDesc")
          .replace("{account}", label)
          .replace("{provider}", provider),
        confirm: t("accounts.sync"),
        destructive: false,
      };
    }

    return {
      title: t("accounts.confirmDisconnectTitle"),
      description: t("accounts.confirmDisconnectDesc")
        .replace("{account}", label)
        .replace("{provider}", provider),
      confirm: t("accounts.disconnect"),
      destructive: true,
    };
  }

  function handleReconnect(provider: CloudProvider) {
    if (!OAUTH_PROVIDERS.includes(provider)) {
      document.getElementById("provider-config")?.scrollIntoView({ behavior: "smooth" });
      toast.message(t("accounts.reconnectHint"));
      return;
    }

    clearPopupPoll();
    const popup = openOAuthPopup(provider);
    if (!popup) {
      toast.error(t("providers.popupBlocked"));
      return;
    }

    setReconnectingProvider(provider);
    popupPollRef.current = window.setInterval(() => {
      if (popup.closed) {
        clearPopupPoll();
        setReconnectingProvider(null);
      }
    }, 500);
  }

  const confirmCopy = confirmDialogCopy();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("accounts.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("accounts.subtitle")}</p>
      </div>

      <ProviderConfigPanel stepLabel={t("providers.stepConfigure")} />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t("providers.stepConnect")}</Badge>
              <CardTitle>{t("providers.connectSectionTitle")}</CardTitle>
            </div>
            <CardDescription>{t("providers.connectSectionDesc")}</CardDescription>
          </div>
          <ConnectAccountDialog
            accounts={accounts}
            disabled={!hasConfiguredProvider}
            disabledReason={t("providers.configureRequired")}
            onConnected={() => {
              queryClient.invalidateQueries({ queryKey: ["accounts"] });
              invalidateFileQueries(queryClient);
            }}
          />
        </CardHeader>
        {!hasConfiguredProvider && (
          <CardContent>
            <Alert>
              <AlertDescription>{t("providers.configureFirst")}</AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

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
            onClick={() => setConfirmAction({ type: "sync-all" })}
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
            const isError = account.status === "error";
            const tokenExpired = isError && isTokenExpiredError(account.error_message);
            const errorText = tokenExpired
              ? t("accounts.errorTokenExpired")
              : account.error_message || t("accounts.errorGeneric");
            const isReconnecting = reconnectingProvider === account.provider;

            return (
              <div
                key={account.id}
                className={`space-y-3 rounded-lg border p-4 ${
                  isError ? "border-destructive/40 bg-destructive/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{getAccountDisplayName(account)}</span>
                      <Badge variant="outline">
                        {PROVIDER_LABELS[account.provider]}
                      </Badge>
                      <Badge variant={isError ? "destructive" : "default"}>
                        {isError ? t("accounts.statusError") : account.status}
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
                        {t("accounts.lastSynced")}:{" "}
                        {new Date(account.last_synced_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    {!isError && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmAction({ type: "sync", account })}
                        disabled={syncMutation.isPending}
                        title={t("accounts.sync")}
                      >
                        <RefreshCw
                          className={`size-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`}
                        />
                        {t("accounts.sync")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        setConfirmAction({ type: "disconnect", account })
                      }
                      disabled={disconnectMutation.isPending}
                    >
                      <Unplug className="size-4 mr-1" />
                      {t("accounts.disconnect")}
                    </Button>
                  </div>
                </div>

                {isError && (
                  <Alert variant="destructive">
                    <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>{errorText}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 border-destructive/40"
                        onClick={() => handleReconnect(account.provider)}
                        disabled={isReconnecting}
                        title={t("accounts.reconnectHint")}
                      >
                        <Link2
                          className={`size-4 mr-1 ${isReconnecting ? "animate-pulse" : ""}`}
                        />
                        {t("accounts.reconnect")}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AllocationSettings accounts={accounts} />

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmCopy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("providers.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                confirmCopy.destructive &&
                  buttonVariants({ variant: "destructive" })
              )}
              onClick={runConfirmedAction}
            >
              {confirmCopy.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
