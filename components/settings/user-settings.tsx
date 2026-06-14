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

async function fetchSettings() {
  const response = await fetch("/api/settings");
  if (!response.ok) throw new Error("Failed to fetch settings");
  const data = await response.json();
  return data.settings;
}

export function UserSettings() {
  const { theme, setTheme } = useTheme();
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
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your TurnixCloud experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Display Name</Label>
          <div className="flex gap-2">
            <Input
              defaultValue={settings?.display_name ?? ""}
              id="displayName"
              placeholder="Your name"
            />
            <Button
              variant="outline"
              onClick={() => {
                const input = document.getElementById("displayName") as HTMLInputElement;
                updateMutation.mutate({ display_name: input.value });
              }}
            >
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
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
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
          <Select
            value={settings?.language ?? "en"}
            onValueChange={(v) => updateMutation.mutate({ language: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
