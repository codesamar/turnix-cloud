import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AllocationStrategy,
  CloudAccount,
} from "@/lib/types/database";

type Supabase = SupabaseClient;

interface AllocationConfig {
  strategy: AllocationStrategy;
  weights: Record<string, number>;
  manual_order: string[];
  rotation_index: number;
}

function pickUploadAccount(
  config: AllocationConfig,
  accounts: CloudAccount[]
): CloudAccount {
  const strategy = config.strategy;

  switch (strategy) {
    case "least_used":
      return [...accounts].sort((a, b) => a.quota_used - b.quota_used)[0];

    case "most_free":
      return [...accounts].sort(
        (a, b) =>
          b.quota_total - b.quota_used - (a.quota_total - a.quota_used)
      )[0];

    case "manual": {
      const order = config.manual_order ?? [];
      for (const accountId of order) {
        const account = accounts.find((a) => a.id === accountId);
        if (account) return account;
      }
      return accounts[0];
    }

    case "weighted_round_robin": {
      const weights = config.weights ?? {};
      const weighted: CloudAccount[] = [];
      for (const account of accounts) {
        const weight = weights[account.id] ?? 1;
        for (let i = 0; i < weight; i++) {
          weighted.push(account);
        }
      }
      if (!weighted.length) return accounts[0];
      return weighted[config.rotation_index % weighted.length];
    }

    case "round_robin":
    default:
      return accounts[config.rotation_index % accounts.length];
  }
}

async function loadAllocationContext(supabase: Supabase, userId: string) {
  const { data: config, error: configError } = await supabase
    .from("allocation_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (configError) {
    throw new Error("Allocation config not found");
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("cloud_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  if (accountsError || !accounts?.length) {
    throw new Error("No active cloud accounts available for upload");
  }

  return {
    config: {
      strategy: config.strategy as AllocationStrategy,
      weights: (config.weights as Record<string, number>) ?? {},
      manual_order: (config.manual_order as string[]) ?? [],
      rotation_index: config.rotation_index,
    },
    accounts,
  };
}

async function advanceRotation(
  supabase: Supabase,
  userId: string,
  strategy: AllocationStrategy
) {
  if (strategy !== "round_robin" && strategy !== "weighted_round_robin") {
    return;
  }

  const { data: config } = await supabase
    .from("allocation_config")
    .select("rotation_index")
    .eq("user_id", userId)
    .single();

  if (!config) return;

  await supabase
    .from("allocation_config")
    .update({ rotation_index: config.rotation_index + 1 })
    .eq("user_id", userId);
}

export async function peekUploadAccount(
  supabase: Supabase,
  userId: string
): Promise<{ account: CloudAccount; strategy: AllocationStrategy }> {
  const { config, accounts } = await loadAllocationContext(supabase, userId);
  return {
    account: pickUploadAccount(config, accounts),
    strategy: config.strategy,
  };
}

export async function selectUploadAccount(
  supabase: Supabase,
  userId: string
): Promise<CloudAccount> {
  const { config, accounts } = await loadAllocationContext(supabase, userId);
  const account = pickUploadAccount(config, accounts);
  await advanceRotation(supabase, userId, config.strategy);
  return account;
}

export async function getAllocationConfig(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("allocation_config")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateAllocationConfig(
  supabase: Supabase,
  userId: string,
  updates: Partial<{
    strategy: AllocationStrategy;
    weights: Record<string, number>;
    manual_order: string[];
  }>
) {
  const { data, error } = await supabase
    .from("allocation_config")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
