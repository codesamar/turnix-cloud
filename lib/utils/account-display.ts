import { PROVIDER_LABELS } from "@/lib/adapters/config";
import type { CloudProvider } from "@/lib/types/database";

interface AccountLike {
  label: string;
  email: string | null;
  provider: CloudProvider;
}

export function getAccountDisplayName(account: AccountLike): string {
  if (account.email) return account.email;
  if (account.label && account.label !== account.provider) return account.label;
  return PROVIDER_LABELS[account.provider];
}

export function getFileAccountLabel(
  account: { provider: CloudProvider; label: string; email: string | null } | null | undefined
): string {
  if (!account) return "—";

  const displayName = getAccountDisplayName(account);
  if (displayName === PROVIDER_LABELS[account.provider]) {
    return displayName;
  }

  return `${displayName} · ${PROVIDER_LABELS[account.provider]}`;
}
