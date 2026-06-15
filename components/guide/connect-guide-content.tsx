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

const dropboxSteps: TranslationKey[] = [
  "guide.dropboxStep1",
  "guide.dropboxStep2",
  "guide.dropboxStep3",
  "guide.dropboxStep4",
  "guide.dropboxStep5",
  "guide.dropboxStep6",
  "guide.dropboxStep7",
];

const teraboxSteps: TranslationKey[] = [
  "guide.teraboxStep1",
  "guide.teraboxStep2",
  "guide.teraboxStep3",
  "guide.teraboxStep4",
  "guide.teraboxStep5",
];

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getProviderRedirectUri(provider: "google_drive" | "dropbox") {
  return `${getAppUrl()}/api/accounts/${provider}/callback`;
}

interface ProviderSetupCardProps {
  title: string;
  steps: TranslationKey[];
  redirectLabel?: string;
  redirectUri?: string;
  onCopyRedirect?: () => void;
  externalLink?: { href: string; label: string };
  showRedirect?: boolean;
}

function ProviderSetupCard({
  title,
  steps,
  redirectLabel,
  redirectUri,
  onCopyRedirect,
  externalLink,
  showRedirect = true,
}: ProviderSetupCardProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{t("guide.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3 list-decimal list-inside text-sm">
          {steps.map((key) => (
            <li key={key} className="text-muted-foreground">
              <span className="text-foreground">{t(key)}</span>
            </li>
          ))}
        </ol>

        {showRedirect && redirectLabel && redirectUri && onCopyRedirect ? (
          <div className="space-y-2">
            <Label>{redirectLabel}</Label>
            <div className="flex gap-2">
              <Input value={redirectUri} readOnly className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={onCopyRedirect}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {externalLink ? (
            <Button asChild variant="outline" size="sm">
              <a href={externalLink.href} target="_blank" rel="noreferrer">
                {externalLink.label}
                <ExternalLink className="size-3 ml-2" />
              </a>
            </Button>
          ) : null}
          <Button asChild size="sm">
            <Link href="/quota">{t("guide.openQuota")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConnectGuideContent() {
  const { t } = useLanguage();
  const googleRedirectUri = getProviderRedirectUri("google_drive");
  const dropboxRedirectUri = getProviderRedirectUri("dropbox");

  function copyRedirectUri(uri: string) {
    navigator.clipboard.writeText(uri);
    toast.success(t("providers.redirectCopied"));
  }

  const flowSteps = [
    { title: t("guide.configureTitle"), desc: t("guide.configureDesc") },
    { title: t("guide.connectTitle"), desc: t("guide.connectDesc") },
    { title: t("guide.syncTitle"), desc: t("guide.syncDesc") },
  ];

  const googleTips = [t("guide.tip403"), t("guide.tipRedirect")];
  const dropboxTips = [
    t("guide.tipDropboxScope"),
    t("guide.tipDropboxDevUsers"),
    t("guide.tipDropboxRedirect"),
  ];
  const teraboxTips = [t("guide.tipTeraboxSession"), t("guide.tipTeraboxUnofficial")];
  const sharedTips = [t("guide.tipEmpty")];

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

      <ProviderSetupCard
        title={t("guide.googleTitle")}
        steps={googleSteps}
        redirectLabel={t("guide.redirectLabel")}
        redirectUri={googleRedirectUri}
        onCopyRedirect={() => copyRedirectUri(googleRedirectUri)}
        externalLink={{
          href: "https://console.cloud.google.com/auth/audience",
          label: "Google Auth platform",
        }}
      />

      <ProviderSetupCard
        title={t("guide.dropboxTitle")}
        steps={dropboxSteps}
        redirectLabel={t("guide.dropboxRedirectLabel")}
        redirectUri={dropboxRedirectUri}
        onCopyRedirect={() => copyRedirectUri(dropboxRedirectUri)}
        externalLink={{
          href: "https://www.dropbox.com/developers/apps",
          label: "Dropbox App Console",
        }}
      />

      <ProviderSetupCard
        title={t("guide.teraboxTitle")}
        steps={teraboxSteps}
        showRedirect={false}
        externalLink={{
          href: "https://www.terabox.com",
          label: "TeraBox",
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("guide.troubleshootTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">{t("guide.troubleshootGoogle")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              {googleTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t("guide.troubleshootDropbox")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              {dropboxTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t("guide.troubleshootTerabox")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              {teraboxTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t("guide.troubleshootGeneral")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              {sharedTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
