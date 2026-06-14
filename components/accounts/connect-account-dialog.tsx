"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
}

export function ConnectAccountDialog({ accounts, onConnected }: ConnectAccountDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [s3Open, setS3Open] = useState(false);

  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
    enabled: open,
  });

  const connectedProviders = new Set(accounts.map((a) => a.provider));

  function handleOAuthConnect(provider: CloudProvider) {
    window.location.href = `/api/accounts/${provider}/connect`;
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
        <Button>
          <Plus className="size-4 mr-2" />
          {t("providers.addAccount")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("providers.addAccount")}</DialogTitle>
          <DialogDescription>{t("providers.addAccountDesc")}</DialogDescription>
        </DialogHeader>

        {!s3Open ? (
          <div className="space-y-3">
            {connectableProviders.map((provider) => {
              const isOAuth = OAUTH_PROVIDERS.includes(provider.provider);
              const isConnected = connectedProviders.has(provider.provider);
              const canConnect = provider.provider === "s3" || provider.configured;

              return (
                <div
                  key={provider.provider}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span>{providerIcons[provider.provider] ?? "☁️"}</span>
                      <span className="font-medium">
                        {PROVIDER_LABELS[provider.provider]}
                      </span>
                      {isConnected && (
                        <Badge variant="secondary">{t("providers.connected")}</Badge>
                      )}
                      {!canConnect && isOAuth && (
                        <Badge variant="outline">{t("providers.notConfigured")}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isOAuth ? t("providers.oauthDesc") : t("providers.s3Desc")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!canConnect && isOAuth && (
                      <Button variant="outline" size="sm" onClick={scrollToConfig}>
                        {t("providers.configure")}
                      </Button>
                    )}
                    {canConnect && provider.provider === "s3" && (
                      <Button size="sm" onClick={() => setS3Open(true)}>
                        {t("providers.connectAccount")}
                      </Button>
                    )}
                    {canConnect && isOAuth && (
                      <Button size="sm" onClick={() => handleOAuthConnect(provider.provider)}>
                        {t("providers.connectAccount")}
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
