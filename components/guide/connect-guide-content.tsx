"use client";

import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/types";

const googleSteps: TranslationKey[] = [
  "guide.googleStep1",
  "guide.googleStep2",
  "guide.googleStep3",
  "guide.googleStep4",
  "guide.googleStep5",
  "guide.googleStep6",
];

function getGoogleRedirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/accounts/google_drive/callback`;
}

export function ConnectGuideContent() {
  const { t } = useLanguage();
  const redirectUri = getGoogleRedirectUri();

  function copyRedirectUri() {
    navigator.clipboard.writeText(redirectUri);
    toast.success(t("providers.redirectCopied"));
  }

  const flowSteps = [
    { title: t("guide.configureTitle"), desc: t("guide.configureDesc") },
    { title: t("guide.connectTitle"), desc: t("guide.connectDesc") },
    { title: t("guide.syncTitle"), desc: t("guide.syncDesc") },
  ];

  const tips = [t("guide.tip403"), t("guide.tipEmpty"), t("guide.tipRedirect")];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("guide.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("guide.subtitle")}</p>
      </div>

      <Alert>
        <AlertDescription>{t("guide.noteConfigured")}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t("guide.flowTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {flowSteps.map((step) => (
            <div key={step.title} className="rounded-lg border p-4">
              <p className="font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
            </div>
          ))}
          <Button asChild>
            <Link href="/quota">{t("guide.openQuota")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("guide.googleTitle")}</CardTitle>
          <CardDescription>{t("guide.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 list-decimal list-inside text-sm">
            {googleSteps.map((key) => (
              <li key={key} className="text-muted-foreground">
                <span className="text-foreground">{t(key)}</span>
              </li>
            ))}
          </ol>

          <div className="space-y-2">
            <Label>{t("guide.redirectLabel")}</Label>
            <div className="flex gap-2">
              <Input value={redirectUri} readOnly className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copyRedirectUri}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://console.cloud.google.com/auth/audience"
                target="_blank"
                rel="noreferrer"
              >
                Google Auth platform
                <ExternalLink className="size-3 ml-2" />
              </a>
            </Button>
            <Button asChild size="sm">
              <Link href="/quota">{t("guide.openQuota")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("guide.troubleshootTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
