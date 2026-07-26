"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

async function fetchFolder(id: string): Promise<FileMetadata | null> {
  const response = await fetch(`/api/files/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch folder");
  const data = await response.json();
  return (data.file as FileMetadata) ?? null;
}

/** Walk parent_id chain from root → current folder (includes current). */
async function fetchFolderBreadcrumbs(folderId: string): Promise<FileMetadata[]> {
  const chain: FileMetadata[] = [];
  const seen = new Set<string>();
  let currentId: string | null = folderId;

  while (currentId && !seen.has(currentId) && chain.length < 64) {
    seen.add(currentId);
    const file = await fetchFolder(currentId);
    if (!file || !file.is_folder) break;
    chain.unshift(file);
    currentId = file.parent_id;
  }

  return chain;
}

export function MyDriveView() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const folderId = searchParams.get("folder");
  const providerFilter = searchParams.get("provider") ?? "all";
  const accountFilter = searchParams.get("account") ?? "all";

  const updateUrl = useCallback(
    (
      updates: {
        folder?: string | null;
        provider?: string | null;
        account?: string | null;
      },
      mode: "push" | "replace" = "push"
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      if ("folder" in updates) {
        if (updates.folder) params.set("folder", updates.folder);
        else params.delete("folder");
      }
      if ("provider" in updates) {
        if (updates.provider && updates.provider !== "all") {
          params.set("provider", updates.provider);
        } else {
          params.delete("provider");
        }
      }
      if ("account" in updates) {
        if (updates.account && updates.account !== "all") {
          params.set("account", updates.account);
        } else {
          params.delete("account");
        }
      }

      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (mode === "replace") router.replace(href);
      else router.push(href);
    },
    [pathname, router, searchParams]
  );

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const {
    data: folderPath = [],
    isError: folderPathError,
    isFetched: folderPathFetched,
  } = useQuery({
    queryKey: ["my-drive-path", folderId],
    queryFn: () => fetchFolderBreadcrumbs(folderId!),
    enabled: Boolean(folderId),
    retry: false,
  });

  // Invalid / deleted folder → drop folder param so UI returns to root.
  useEffect(() => {
    if (
      folderId &&
      folderPathFetched &&
      (folderPathError || folderPath.length === 0)
    ) {
      updateUrl({ folder: null }, "replace");
    }
  }, [
    folderId,
    folderPathFetched,
    folderPathError,
    folderPath.length,
    updateUrl,
  ]);

  const breadcrumbs = folderId ? folderPath : [];
  const currentFolder =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1]! : null;
  const folderPathLoading = Boolean(folderId) && !folderPathFetched;

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
    // Prefer URL folder id so listing works before breadcrumb chain finishes.
    if (folderId) {
      params.set("parentId", folderId);
    } else if (accountFilter !== "all") {
      params.set("accountId", accountFilter);
    } else if (providerFilter !== "all") {
      params.set("provider", providerFilter);
    }
    const query = params.toString();
    return query ? `/api/files?${query}` : "/api/files";
  }, [folderId, providerFilter, accountFilter]);

  function handleProviderFilterChange(value: string) {
    updateUrl({ provider: value, account: null, folder: null });
  }

  function handleAccountFilterChange(value: string) {
    updateUrl({ account: value, folder: null });
  }

  function handleNavigate(folder: FileMetadata) {
    updateUrl({ folder: folder.id });
  }

  function handleBreadcrumbClick(index: number) {
    if (index === -1) {
      updateUrl({ folder: null });
      return;
    }
    const target = breadcrumbs[index];
    if (target) updateUrl({ folder: target.id });
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

      {!folderPathLoading && (
        <UploadDropzone
          parentPath={currentFolder?.provider_file_id ?? "/"}
          folderName={currentFolder?.name ?? null}
          onComplete={handleUploadComplete}
        />
      )}
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
