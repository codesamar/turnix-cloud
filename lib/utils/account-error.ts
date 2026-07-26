export const ACCOUNT_ERROR_TOKEN_EXPIRED = "token_expired";

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
    lower.includes("token has been expired")
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
