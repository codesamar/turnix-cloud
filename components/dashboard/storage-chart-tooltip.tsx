"use client";

import type { TooltipProps } from "recharts";
import { useLanguage } from "@/components/providers/language-provider";

export interface StorageChartRow {
  name: string;
  used: number;
  free: number;
  total: number;
  usedPercent: number;
}

export function StorageChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  const { t } = useLanguage();

  if (!active || !payload?.length) return null;

  const data = payload[0].payload as StorageChartRow;
  const free = Math.max(0, data.free);

  return (
    <div className="rounded-lg border bg-popover px-3 py-2.5 shadow-md min-w-[200px]">
      <p className="font-medium text-popover-foreground text-sm mb-2 truncate max-w-[240px]">
        {label}
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("dashboard.storageUsed")}</span>
          <span className="font-medium text-popover-foreground tabular-nums">
            {data.used} GB ({data.usedPercent}%)
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("dashboard.storageTotal")}</span>
          <span className="font-medium text-popover-foreground tabular-nums">
            {data.total} GB
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("dashboard.storageFree")}</span>
          <span className="font-medium text-popover-foreground tabular-nums">
            {free} GB
          </span>
        </div>
      </div>
    </div>
  );
}
