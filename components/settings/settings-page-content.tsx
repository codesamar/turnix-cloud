"use client";

import { UserSettings } from "@/components/settings/user-settings";
import { useLanguage } from "@/components/providers/language-provider";

export function SettingsPageContent() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </div>
      <UserSettings />
    </div>
  );
}
