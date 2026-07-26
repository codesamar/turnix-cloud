export const ACCOUNT_ERROR_TOKEN_EXPIRED = "token_expired";
export const ACCOUNT_DISCONNECTED_CODE = "account_disconnected";

export class AccountDisconnectedError extends Error {
  readonly code = ACCOUNT_DISCONNECTED_CODE;
  readonly accountLabel: string;

  constructor(accountLabel: string) {
    super(ACCOUNT_DISCONNECTED_CODE);
    this.name = "AccountDisconnectedError";
    this.accountLabel = accountLabel;
  }
}

export function classifyAccountError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("refresh") ||
    lower.includes("invalid_grant") ||
    lower.includes("expired") ||
    lower.includes("no refresh token") ||
    lower.includes("session is invalid") ||
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("invalid_token") ||
    lower.includes("token has been expired") ||
    lower.includes(ACCOUNT_DISCONNECTED_CODE)
  ) {
    return ACCOUNT_ERROR_TOKEN_EXPIRED;
  }

  return message || "Sync failed";
}

export function isTokenExpiredError(errorMessage: string | null | undefined): boolean {
  if (!errorMessage) return true;
  if (errorMessage === ACCOUNT_ERROR_TOKEN_EXPIRED) return true;
  return classifyAccountError(new Error(errorMessage)) === ACCOUNT_ERROR_TOKEN_EXPIRED;
}

export function isAccountDisconnectedError(error: unknown): error is AccountDisconnectedError {
  return error instanceof AccountDisconnectedError;
}

export function toAccountApiError(error: unknown): {
  error: string;
  code?: string;
  accountLabel?: string;
} {
  if (isAccountDisconnectedError(error)) {
    return {
      error: error.message,
      code: error.code,
      accountLabel: error.accountLabel,
    };
  }

  return {
    error: error instanceof Error ? error.message : "Request failed",
  };
}
