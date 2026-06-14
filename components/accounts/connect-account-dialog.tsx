"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { OAUTH_PROVIDERS, PROVIDER_LABELS } from "@/lib/adapters/config";
import type { CloudAccount, CloudProvider } from "@/lib/types/database";
import type { ProviderStatus } from "@/lib/services/provider-config";
import { useLanguage } from "@/components/providers/language-provider";
import { ConnectS3Form } from "@/components/accounts/connect-s3-form";
import { getAccountDisplayName } from "@/lib/utils/account-display";
import { isOAuthMessage, openOAuthPopup } from "@/lib/oauth/popup";

const providerIcons: Record<string, string> = {
  google_drive: "🔵",
  onedrive: "🟦",
  dropbox: "🔷",
  yandex: "🟡",
  s3: "🟠",
};

async function fetchProviders() {
  const response = await fetch("/api/providers");
  if (!response.ok) throw new Error("Failed to fetch providers");
  const data = await response.json();
  return data.providers as ProviderStatus[];
}

interface ConnectAccountDialogProps {
  accounts: CloudAccount[];
  onConnected: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function ConnectAccountDialog({
  accounts,
  onConnected,
  disabled = false,
  disabledReason,
}: ConnectAccountDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [s3Open, setS3Open] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<CloudProvider | null>(null);
  const popupPollRef = useRef<number | null>(null);

  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
    enabled: open,
  });

  const accountsByProvider = accounts.reduce<Map<CloudProvider, CloudAccount[]>>(
    (map, account) => {
      const existing = map.get(account.provider) ?? [];
      map.set(account.provider, [...existing, account]);
      return map;
    },
    new Map()
  );

  function clearPopupPoll() {
    if (popupPollRef.current !== null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  }

  function resolveOAuthError(error?: string) {
    if (error === "oauth_denied") return t("providers.oauthDenied");
    if (error === "provider_not_configured") return t("providers.connectFailed");
    return error ?? t("providers.connectFailed");
  }

  useEffect(() => {
    function handleOAuthMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!isOAuthMessage(event.data)) return;

      clearPopupPoll();
      setConnectingProvider(null);

      if (event.data.error) {
        toast.error(resolveOAuthError(event.data.error));
        return;
      }

      if (event.data.connected) {
        toast.success(t("providers.connectSuccess"));
        onConnected();
        setOpen(false);
      }
    }

    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
      clearPopupPoll();
    };
  }, [onConnected, t]);

  function handleOAuthConnect(provider: CloudProvider) {
    clearPopupPoll();
    const popup = openOAuthPopup(provider);

    if (!popup) {
      toast.error(t("providers.popupBlocked"));
      return;
    }

    setConnectingProvider(provider);

    popupPollRef.current = window.setInterval(() => {
      if (popup.closed) {
        clearPopupPoll();
        setConnectingProvider(null);
      }
    }, 500);
  }

  function scrollToConfig() {
    setOpen(false);
    document.getElementById("provider-config")?.scrollIntoView({ behavior: "smooth" });
  }

  const connectableProviders = providers.filter(
    (p) => p.provider !== "mega" && p.provider !== "pcloud"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} title={disabled ? disabledReason : undefined}>
          <Plus className="size-4 mr-2" />
          {t("providers.addAccount")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("providers.addAccount")}</DialogTitle>
          <DialogDescription>
            {t("providers.addAccountDesc")} {t("providers.oauthPopupHint")}
          </DialogDescription>
        </DialogHeader>

        {!s3Open ? (
          <div className="space-y-3">
            {connectableProviders.map((provider) => {
              const isOAuth = OAUTH_PROVIDERS.includes(provider.provider);
              const providerAccounts = accountsByProvider.get(provider.provider) ?? [];
              const connectedCount = providerAccounts.length;
              const canConnect = provider.provider === "s3" || provider.configured;

              return (
                <div
                  key={provider.provider}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{providerIcons[provider.provider] ?? "☁️"}</span>
                      <span className="font-medium">
                        {PROVIDER_LABELS[provider.provider]}
                      </span>
                      {connectedCount > 0 && (
                        <Badge variant="secondary">
                          {connectedCount} {t("providers.connected")}
                        </Badge>
                      )}
                      {!canConnect && isOAuth && (
                        <Badge variant="outline">{t("providers.notConfigured")}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isOAuth ? t("providers.oauthDescMultiple") : t("providers.s3Desc")}
                    </p>
                    {connectedCount > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5 pt-1">
                        {providerAccounts.map((account) => (
                          <li key={account.id} className="truncate">
                            {getAccountDisplayName(account)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!canConnect && isOAuth && (
                      <Button variant="outline" size="sm" onClick={scrollToConfig}>
                        {t("providers.configure")}
                      </Button>
                    )}
                    {canConnect && provider.provider === "s3" && (
                      <Button size="sm" onClick={() => setS3Open(true)}>
                        {connectedCount > 0
                          ? t("providers.addAnother")
                          : t("providers.connectAccount")}
                      </Button>
                    )}
                    {canConnect && isOAuth && (
                      <Button
                        size="sm"
                        onClick={() => handleOAuthConnect(provider.provider)}
                        disabled={connectingProvider === provider.provider}
                      >
                        {connectingProvider === provider.provider ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            {t("providers.connecting")}
                          </>
                        ) : connectedCount > 0 ? (
                          t("providers.addAnother")
                        ) : (
                          t("providers.connectAccount")
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium">{PROVIDER_LABELS.s3}</h3>
            <ConnectS3Form
              onConnected={() => {
                setS3Open(false);
                setOpen(false);
                onConnected();
              }}
              onCancel={() => setS3Open(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
