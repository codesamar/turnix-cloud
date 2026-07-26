"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState({
    label: "",
    ndusToken: "",
    baseUrl: "",
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch("/api/accounts/terabox/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label || undefined,
          ndusToken: form.ndusToken,
          baseUrl: form.baseUrl || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Connection failed"
        );
      }

      toast.success(t("providers.connectSuccess"));
      toast.message(t("providers.terabox.syncInBackground"));
      onConnected();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.error(t("providers.terabox.connectTimeout"));
      } else {
        toast.error(
          err instanceof Error ? err.message : t("providers.connectFailed")
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
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
        <Label htmlFor="terabox-ndus-token">{t("providers.terabox.ndusToken")}</Label>
        <div className="relative">
          <Input
            id="terabox-ndus-token"
            type={showToken ? "text" : "password"}
            placeholder={t("providers.terabox.ndusTokenPlaceholder")}
            value={form.ndusToken}
            onChange={(e) => setForm({ ...form, ndusToken: e.target.value })}
            className="pr-10"
            required
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowToken((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            aria-label={showToken ? "Hide token" : "Show token"}
          >
            {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
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
