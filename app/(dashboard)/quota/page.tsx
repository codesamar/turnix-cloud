import { AccountsPanel } from "@/components/accounts/accounts-panel";
import { UserSettings } from "@/components/settings/user-settings";

export default function QuotaPage() {
  return (
    <div className="space-y-8">
      <AccountsPanel />
      <UserSettings />
    </div>
  );
}
