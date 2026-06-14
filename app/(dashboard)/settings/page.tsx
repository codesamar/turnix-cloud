import { UserSettings } from "@/components/settings/user-settings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile, theme, and language preferences
        </p>
      </div>
      <UserSettings />
    </div>
  );
}
