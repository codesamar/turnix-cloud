"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/components/providers/language-provider";

interface ConnectTeraboxFormProps {
  onConnected: () => void;
  onCancel?: () => void;
}

export function ConnectTeraboxForm({ onConnected, onCancel }: ConnectTeraboxFormProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    label: "",
    ndusToken: "",
    baseUrl: "",
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/accounts/terabox/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label || undefined,
          ndusToken: form.ndusToken,
          baseUrl: form.baseUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Connection failed");
      }

      const data = await response.json();
      if (data.syncError) {
        toast.warning(`${t("providers.terabox.syncFailed")}: ${data.syncError}`);
      } else {
        toast.success(t("providers.connectSuccess"));
      }
      onConnected();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("providers.connectFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <AlertDescription>{t("providers.terabox.sessionWarning")}</AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>{t("providers.terabox.label")}</Label>
        <Input
          placeholder={t("providers.terabox.labelPlaceholder")}
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("providers.terabox.ndusToken")}</Label>
        <Input
          type="password"
          placeholder={t("providers.terabox.ndusTokenPlaceholder")}
          value={form.ndusToken}
          onChange={(e) => setForm({ ...form, ndusToken: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">{t("providers.terabox.ndusTokenHint")}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("providers.terabox.baseUrl")}</Label>
        <Input
          placeholder="https://www.terabox.com"
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("providers.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("providers.connecting") : t("providers.connectAccount")}
        </Button>
      </div>
    </form>
  );
}
