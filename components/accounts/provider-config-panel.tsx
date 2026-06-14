"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { OAUTH_PROVIDERS, PROVIDER_LABELS } from "@/lib/adapters/config";
import type { CloudProvider } from "@/lib/types/database";
import { useLanguage } from "@/components/providers/language-provider";
import type { ProviderStatus } from "@/lib/services/provider-config";

async function fetchProviders() {
  const response = await fetch("/api/providers");
  if (!response.ok) throw new Error("Failed to fetch providers");
  const data = await response.json();
  return data.providers as ProviderStatus[];
}

interface ProviderFormState {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

export function ProviderConfigPanel({ stepLabel }: { stepLabel?: string }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      provider,
      payload,
    }: {
      provider: CloudProvider;
      payload: Record<string, unknown>;
    }) => {
      const response = await fetch(`/api/providers/${provider}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to save");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(t("providers.configSaved"));
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const oauthProviders = providers.filter((p) => OAUTH_PROVIDERS.includes(p.provider));

  function copyRedirectUri(uri: string) {
    navigator.clipboard.writeText(uri);
    toast.success(t("providers.redirectCopied"));
  }

  function handleSave(provider: CloudProvider, form: ProviderFormState, hasSecret: boolean) {
    saveMutation.mutate({
      provider,
      payload: {
        enabled: form.enabled,
        clientId: form.clientId,
        clientSecret: form.clientSecret || undefined,
        extra: provider === "onedrive" ? { tenantId: form.tenantId || "common" } : {},
      },
    });
  }

  return (
    <Card id="provider-config">
      <CardHeader>
        <div className="flex items-center gap-2">
          {stepLabel && <Badge variant="outline">{stepLabel}</Badge>}
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="size-5" />
            {t("providers.configTitle")}
          </CardTitle>
        </div>
        <CardDescription>{t("providers.configDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground">{t("providers.loading")}</p>
        )}
        {!isLoading && (
          <Accordion type="multiple" className="w-full">
            {oauthProviders.map((provider) => (
              <ProviderConfigItem
                key={provider.provider}
                provider={provider}
                onSave={handleSave}
                onCopyRedirect={copyRedirectUri}
                isSaving={saveMutation.isPending}
              />
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

interface ProviderConfigItemProps {
  provider: ProviderStatus;
  onSave: (provider: CloudProvider, form: ProviderFormState, hasSecret: boolean) => void;
  onCopyRedirect: (uri: string) => void;
  isSaving: boolean;
}

function ProviderConfigItem({
  provider,
  onSave,
  onCopyRedirect,
  isSaving,
}: ProviderConfigItemProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ProviderFormState>({
    enabled: provider.enabled,
    clientId: provider.clientId ?? "",
    clientSecret: "",
    tenantId: provider.extra?.tenantId ?? "common",
  });

  const canSave =
    form.clientId.trim().length > 0 &&
    (provider.configured || form.clientSecret.trim().length > 0);

  return (
    <AccordionItem value={provider.provider}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <span>{PROVIDER_LABELS[provider.provider]}</span>
          <Badge variant={provider.configured ? "default" : "secondary"}>
            {provider.configured ? t("providers.configured") : t("providers.notConfigured")}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">{t("providers.enable")}</p>
            <p className="text-xs text-muted-foreground">{t("providers.enableDesc")}</p>
          </div>
          <Switch
            checked={form.enabled}
            onCheckedChange={(enabled) => setForm({ ...form, enabled })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("providers.clientId")}</Label>
          <Input
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            placeholder="OAuth Client ID"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("providers.clientSecret")}</Label>
          <Input
            type="password"
            value={form.clientSecret}
            onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
            placeholder={
              provider.configured
                ? t("providers.secretPlaceholderKeep")
                : t("providers.secretPlaceholder")
            }
          />
        </div>

        {provider.provider === "onedrive" && (
          <div className="space-y-2">
            <Label>{t("providers.tenantId")}</Label>
            <Input
              value={form.tenantId}
              onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
              placeholder="common"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>{t("providers.redirectUri")}</Label>
          <div className="flex gap-2">
            <Input value={provider.redirectUri} readOnly className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onCopyRedirect(provider.redirectUri)}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("providers.redirectHint")}</p>
        </div>

        <Button
          onClick={() => onSave(provider.provider, form, provider.configured)}
          disabled={isSaving || !canSave}
        >
          {t("providers.saveConfig")}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}
