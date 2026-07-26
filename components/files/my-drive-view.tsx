"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileExplorer } from "@/components/files/file-explorer";
import { UploadDropzone } from "@/components/files/upload-dropzone";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVIDER_LABELS } from "@/lib/adapters/config";
import type { CloudAccount, CloudProvider, FileMetadata } from "@/lib/types/database";
import { getAccountDisplayName } from "@/lib/utils/account-display";
import { useLanguage } from "@/components/providers/language-provider";

async function fetchAccounts() {
  const response = await fetch("/api/accounts");
  if (!response.ok) throw new Error("Failed to fetch accounts");
  const data = await response.json();
  return data.accounts as CloudAccount[];
}

export function MyDriveView() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [breadcrumbs, setBreadcrumbs] = useState<FileMetadata[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FileMetadata | null>(null);
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const connectedProviders = useMemo(() => {
    const seen = new Set<CloudProvider>();
    const providers: CloudProvider[] = [];
    for (const account of accounts) {
      if (!seen.has(account.provider)) {
        seen.add(account.provider);
        providers.push(account.provider);
      }
    }
    return providers.sort((a, b) =>
      PROVIDER_LABELS[a].localeCompare(PROVIDER_LABELS[b])
    );
  }, [accounts]);

  const accountsForSelect = useMemo(() => {
    const list =
      providerFilter === "all"
        ? accounts
        : accounts.filter((account) => account.provider === providerFilter);

    return [...list].sort((a, b) => {
      const providerCmp = PROVIDER_LABELS[a.provider].localeCompare(
        PROVIDER_LABELS[b.provider]
      );
      if (providerCmp !== 0) return providerCmp;
      return getAccountDisplayName(a).localeCompare(getAccountDisplayName(b));
    });
  }, [accounts, providerFilter]);

  const fetchUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (currentFolder) {
      params.set("parentId", currentFolder.id);
    } else if (accountFilter !== "all") {
      params.set("accountId", accountFilter);
    } else if (providerFilter !== "all") {
      params.set("provider", providerFilter);
    }
    const query = params.toString();
    return query ? `/api/files?${query}` : "/api/files";
  }, [currentFolder, providerFilter, accountFilter]);

  function resetNavigation() {
    setBreadcrumbs([]);
    setCurrentFolder(null);
  }

  function handleProviderFilterChange(value: string) {
    setProviderFilter(value);
    setAccountFilter("all");
    resetNavigation();
  }

  function handleAccountFilterChange(value: string) {
    setAccountFilter(value);
    resetNavigation();
  }

  function handleNavigate(folder: FileMetadata) {
    setBreadcrumbs((prev) => [...prev, folder]);
    setCurrentFolder(folder);
  }

  function handleBreadcrumbClick(index: number) {
    if (index === -1) {
      resetNavigation();
      return;
    }
    setBreadcrumbs((prev) => {
      const next = prev.slice(0, index + 1);
      setCurrentFolder(next[index] ?? null);
      return next;
    });
  }

  function handleUploadComplete() {
    queryClient.invalidateQueries({ queryKey: ["my-drive"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("myDrive.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("myDrive.subtitle")}
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[28rem]">
          <div className="space-y-2">
            <Label htmlFor="my-drive-provider-filter">
              {t("myDrive.providerFilter")}
            </Label>
            <Select
              value={providerFilter}
              onValueChange={handleProviderFilterChange}
            >
              <SelectTrigger id="my-drive-provider-filter">
                <SelectValue placeholder={t("myDrive.providerAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("myDrive.providerAll")}</SelectItem>
                {connectedProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {PROVIDER_LABELS[provider]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="my-drive-account-filter">
              {t("myDrive.accountFilter")}
            </Label>
            <Select
              value={accountFilter}
              onValueChange={handleAccountFilterChange}
              disabled={accountsForSelect.length === 0}
            >
              <SelectTrigger id="my-drive-account-filter">
                <SelectValue placeholder={t("myDrive.accountAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("myDrive.accountAll")}</SelectItem>
                {accountsForSelect.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {providerFilter === "all"
                      ? `${getAccountDisplayName(account)} · ${PROVIDER_LABELS[account.provider]}`
                      : getAccountDisplayName(account)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <UploadDropzone
        parentPath={currentFolder?.provider_file_id ?? "/"}
        folderName={currentFolder?.name ?? null}
        onComplete={handleUploadComplete}
      />
      <FileExplorer
        queryKey="my-drive"
        fetchUrl={fetchUrl}
        onNavigate={handleNavigate}
        breadcrumbs={breadcrumbs}
        onBreadcrumbClick={handleBreadcrumbClick}
        emptyMessage={t("myDrive.empty")}
      />
    </div>
  );
}
