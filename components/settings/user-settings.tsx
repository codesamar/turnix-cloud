"use client";

import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import type { Language } from "@/lib/i18n/types";

async function fetchSettings() {
  const response = await fetch("/api/settings");
  if (!response.ok) throw new Error("Failed to fetch settings");
  const data = await response.json();
  return data.settings;
}

export function UserSettings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t("settings.saved"));
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  async function handleLanguageChange(nextLanguage: Language) {
    await setLanguage(nextLanguage);
    toast.success(t("settings.saved"));
    queryClient.invalidateQueries({ queryKey: ["settings"] });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.preferences")}</CardTitle>
        <CardDescription>{t("settings.preferencesDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("settings.displayName")}</Label>
          <div className="flex gap-2">
            <Input
              defaultValue={settings?.display_name ?? ""}
              id="displayName"
              placeholder={t("common.placeholder.name")}
            />
            <Button
              variant="outline"
              onClick={() => {
                const input = document.getElementById("displayName") as HTMLInputElement;
                updateMutation.mutate({ display_name: input.value });
              }}
            >
              {t("settings.save")}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("settings.theme")}</Label>
          <Select
            value={theme ?? settings?.theme ?? "system"}
            onValueChange={(v) => {
              setTheme(v);
              updateMutation.mutate({ theme: v });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("settings.theme.light")}</SelectItem>
              <SelectItem value="dark">{t("settings.theme.dark")}</SelectItem>
              <SelectItem value="system">{t("settings.theme.system")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("settings.language")}</Label>
          <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("settings.language.en")}</SelectItem>
              <SelectItem value="id">{t("settings.language.id")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
