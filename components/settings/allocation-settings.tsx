"use client";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AllocationStrategy, CloudAccount } from "@/lib/types/database";
import { PROVIDER_LABELS } from "@/lib/adapters/config";
import { useLanguage } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/types";
import { getAccountDisplayName } from "@/lib/utils/account-display";

const STRATEGIES: AllocationStrategy[] = [
  "round_robin",
  "weighted_round_robin",
  "least_used",
  "most_free",
  "manual",
];

function strategyLabelKey(strategy: AllocationStrategy): TranslationKey {
  return `allocation.strategy.${strategy}.label`;
}

function strategyDescKey(strategy: AllocationStrategy): TranslationKey {
  return `allocation.strategy.${strategy}.desc`;
}

async function fetchAllocation() {
  const response = await fetch("/api/allocation");
  if (!response.ok) throw new Error("Failed to fetch allocation");
  const data = await response.json();
  return data.allocation;
}

interface AllocationSettingsProps {
  accounts: CloudAccount[];
}

export function AllocationSettings({ accounts }: AllocationSettingsProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["allocation"],
    queryFn: fetchAllocation,
  });

  const strategy: AllocationStrategy = config?.strategy ?? "round_robin";

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const response = await fetch("/api/allocation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update allocation");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t("allocation.saved"));
      queryClient.invalidateQueries({ queryKey: ["allocation"] });
    },
  });

  function handleStrategyChange(nextStrategy: AllocationStrategy) {
    updateMutation.mutate({ strategy: nextStrategy });
  }

  function handleManualOrderChange(accountId: string, index: number) {
    const currentOrder = (config?.manual_order as string[]) ?? accounts.map((a) => a.id);
    const newOrder = [...currentOrder];
    newOrder[index] = accountId;
    updateMutation.mutate({ manual_order: newOrder });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("allocation.title")}</CardTitle>
        <CardDescription>{t("allocation.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>{t("allocation.note")}</AlertDescription>
        </Alert>

        {accounts.length <= 1 && (
          <p className="text-xs text-muted-foreground">{t("allocation.singleAccount")}</p>
        )}

        <div className="space-y-2">
          <Label>{t("allocation.strategyLabel")}</Label>
          <Select
            value={strategy}
            onValueChange={(v) => handleStrategyChange(v as AllocationStrategy)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STRATEGIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(strategyLabelKey(s))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t(strategyDescKey(strategy))}</p>
        </div>

        {strategy === "manual" && accounts.length > 0 && (
          <div className="space-y-2">
            <Label>{t("allocation.manualOrderLabel")}</Label>
            <p className="text-xs text-muted-foreground">{t("allocation.manualOrderDesc")}</p>
            {accounts.map((_, index) => (
              <Select
                key={index}
                value={(config?.manual_order as string[])?.[index] ?? accounts[index]?.id}
                onValueChange={(v) => handleManualOrderChange(v, index)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`${t("allocation.priority")} ${index + 1}`} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getAccountDisplayName(account)} ({PROVIDER_LABELS[account.provider]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
