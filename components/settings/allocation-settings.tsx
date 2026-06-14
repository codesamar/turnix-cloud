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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AllocationStrategy, CloudAccount } from "@/lib/types/database";
import { PROVIDER_LABELS } from "@/lib/adapters/config";

const STRATEGIES: { value: AllocationStrategy; label: string; description: string }[] = [
  { value: "round_robin", label: "Round Robin", description: "Rotate uploads across accounts evenly" },
  { value: "weighted_round_robin", label: "Weighted Round Robin", description: "Rotate based on assigned weights" },
  { value: "least_used", label: "Least Used", description: "Prefer account with lowest usage" },
  { value: "most_free", label: "Most Free Space", description: "Prefer account with most available space" },
  { value: "manual", label: "Manual Order", description: "Use accounts in specified order" },
];

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
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["allocation"],
    queryFn: fetchAllocation,
  });

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
      toast.success("Allocation settings updated");
      queryClient.invalidateQueries({ queryKey: ["allocation"] });
    },
  });

  function handleStrategyChange(strategy: AllocationStrategy) {
    updateMutation.mutate({ strategy });
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
        <CardTitle>Upload Allocation</CardTitle>
        <CardDescription>
          Choose how uploads are distributed across connected accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Strategy</Label>
          <Select
            value={config?.strategy ?? "round_robin"}
            onValueChange={(v) => handleStrategyChange(v as AllocationStrategy)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STRATEGIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {STRATEGIES.find((s) => s.value === config?.strategy)?.description}
          </p>
        </div>

        {config?.strategy === "manual" && accounts.length > 0 && (
          <div className="space-y-2">
            <Label>Manual Priority Order</Label>
            {accounts.map((_, index) => (
              <Select
                key={index}
                value={(config?.manual_order as string[])?.[index] ?? accounts[index]?.id}
                onValueChange={(v) => handleManualOrderChange(v, index)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Priority ${index + 1}`} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.label} ({PROVIDER_LABELS[account.provider]})
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
