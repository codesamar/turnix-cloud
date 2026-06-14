"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";

interface ConnectS3FormProps {
  onConnected: () => void;
  onCancel?: () => void;
}

export function ConnectS3Form({ onConnected, onCancel }: ConnectS3FormProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    endpoint: "",
    bucket: "",
    accessKeyId: "",
    secretAccessKey: "",
    region: "us-east-1",
    label: "",
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "s3", ...form }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Connection failed");
      }

      toast.success(t("providers.connectSuccess"));
      onConnected();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("providers.connectFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("providers.s3.label")}</Label>
        <Input
          placeholder={t("providers.s3.labelPlaceholder")}
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("providers.s3.endpoint")}</Label>
        <Input
          placeholder="https://s3.amazonaws.com"
          value={form.endpoint}
          onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t("providers.s3.bucket")}</Label>
        <Input
          value={form.bucket}
          onChange={(e) => setForm({ ...form, bucket: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t("providers.s3.accessKey")}</Label>
        <Input
          value={form.accessKeyId}
          onChange={(e) => setForm({ ...form, accessKeyId: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t("providers.s3.secretKey")}</Label>
        <Input
          type="password"
          value={form.secretAccessKey}
          onChange={(e) => setForm({ ...form, secretAccessKey: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>{t("providers.s3.region")}</Label>
        <Input
          value={form.region}
          onChange={(e) => setForm({ ...form, region: e.target.value })}
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
