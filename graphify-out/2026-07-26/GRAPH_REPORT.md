# Graph Report - turnix-cloud  (2026-07-26)

## Corpus Check
- 159 files · ~81,524 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1088 nodes · 2095 edges · 105 communities (52 shown, 53 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec192f6d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- accounts-panel.tsx
- file-explorer.tsx
- sidebar.tsx
- TurnixCloud
- Google OAuth — Production Setup
- carousel.tsx
- OmniCloud
- devDependencies
- upload-dropzone.tsx
- compilerOptions
- index.ts
- provider-config.ts
- getAdapter
- registry.ts
- Dropbox — Setup Lengkap
- createClient
- types.ts
- utils.ts
- cn
- components.json
- menubar.tsx
- database.ts
- dependencies
- TeraBoxApp
- CloudAdapter
- terabox.ts
- date-fns
- context-menu.tsx
- alert-dialog.tsx
- upload-dropzone.tsx
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- slider.tsx
- sidebar.tsx
- FileExplorer
- middleware.ts
- allocation.ts
- useLanguage
- command.tsx
- terabox-client.ts
- extends
- allocation-settings.tsx
- CloudAdapter
- classnames
- tabs.tsx
- cmdk
- getAdapter
- embla-carousel-react
- sync.ts
- @hookform/resolvers
- input-otp
- lucide-react
- next
- next.config.mjs
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dialog
- registry.ts
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- class-variance-authority
- @radix-ui/react-select
- connect-guide-content.tsx
- @radix-ui/react-slider
- upload.ts
- index.ts
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react-dom
- react-resizable-panels
- recharts
- shadcn-ui
- sonner
- @supabase/ssr
- @supabase/supabase-js
- tailwind-merge
- tailwindcss-animate
- @tanstack/react-query
- @tanstack/react-table
- terabox-api
- vaul
- zod
- postcss.config.mjs
- tailwind.config.ts
- class-variance-authority
- onedrive.ts
- hover-card.tsx
- @radix-ui/react-tabs
- file-explorer.tsx
- textarea.tsx
- react-hook-form
- dropdown-menu.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 77 edges
2. `createClient()` - 48 edges
3. `useLanguage()` - 43 edges
4. `getAdapter()` - 26 edges
5. `getAccountCredentials()` - 22 edges
6. `CloudProvider` - 22 edges
7. `CloudAdapter` - 21 edges
8. `SamarCloud` - 19 edges
9. `Button` - 17 edges
10. `OAUTH_PROVIDERS` - 17 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  app/api/files/route.ts → lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  app/api/uploads/route.ts → lib/supabase/server.ts
- `ProviderSetupCardProps` --references--> `TranslationKey`  [EXTRACTED]
  components/guide/connect-guide-content.tsx → lib/i18n/types.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (105 total, 53 thin omitted)

### Community 0 - "accounts-panel.tsx"
Cohesion: 0.16
Nodes (19): PATCH(), PROVIDER_PARAM_MAP, RouteParams, GET(), ActiveUpload, getAppUrl(), getOAuthRedirectUri(), ENV_MAP (+11 more)

### Community 1 - "file-explorer.tsx"
Cohesion: 0.09
Nodes (33): FileExplorerProps, GridFileMedia(), FilePreviewDialog(), FilePreviewDialogProps, fetchAccounts(), fetchFolders(), MoveFileDialog(), MoveFileDialogProps (+25 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.05
Nodes (46): AppSidebar(), AppSidebarNav(), AppSidebarProps, DashboardShellProps, helpNavItems, navItems, SidebarNavItem, SignOutButton() (+38 more)

### Community 3 - "TurnixCloud"
Cohesion: 0.04
Nodes (47): 1. Clone and install, 2. Create a Supabase project, 3. Run database migrations, 4. Environment variables, 5. Configure Supabase Auth, 6. Connect a provider (example: Google Drive), Accounts, 🔌 API overview (+39 more)

### Community 4 - "Google OAuth — Production Setup"
Cohesion: 0.05
Nodes (36): 1.1 Environment variables (Vercel / hosting), 1.2 Supabase Auth URLs, 2.1 Redirect URI production, 2.2 Branding & kebijakan (wajib verifikasi), 2.3 Submit App Verification, 2.4 Publish app (In Production), Checklist production, Configure vs Connect (SamarCloud) (+28 more)

### Community 5 - "carousel.tsx"
Cohesion: 0.05
Nodes (34): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+26 more)

### Community 6 - "OmniCloud"
Cohesion: 0.05
Nodes (40): 1. Create the backend environment file, 1. Install dependencies, 2. Build and start the containers, 2. Create the backend environment file, 3. Fill in the environment variables, 3. Stop the containers, 4. Configure provider credentials, Accounts (+32 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (33): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+25 more)

### Community 8 - "upload-dropzone.tsx"
Cohesion: 0.18
Nodes (14): AccountsPanel(), ConfirmAction, fetchAccounts(), fetchProviders(), AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+6 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, next.config.mjs, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 10 - "index.ts"
Cohesion: 0.10
Nodes (14): inter, metadata, OAuthDoneClient(), AuthBrand(), SamarLogo(), SamarLogoProps, SamarLogoVariant, applyDocumentLanguage() (+6 more)

### Community 11 - "provider-config.ts"
Cohesion: 0.29
Nodes (9): decryptWith(), deriveKey(), __dirname, dryRun, encryptWith(), main(), reencryptField(), root (+1 more)

### Community 12 - "getAdapter"
Cohesion: 0.15
Nodes (23): GET(), RouteParams, GET(), RouteParams, GET(), POST(), getAdapter(), getAccountCredentials() (+15 more)

### Community 13 - "registry.ts"
Cohesion: 0.18
Nodes (13): POST(), GET(), DELETE(), GET(), PATCH(), RouteParams, GET(), PATCH() (+5 more)

### Community 14 - "Dropbox — Setup Lengkap"
Cohesion: 0.08
Nodes (26): 1.1 Buka App Console, 1.2 Pilih tipe app, 1.3 Atur permissions (scope), 1.4 Salin App key & App secret, 2.1 Daftarkan di Dropbox, 2.2 Salin dari dashboard SamarCloud (alternatif), 3.1 Lewat dashboard (disarankan), 3.2 Lewat `.env.local` (fallback) (+18 more)

### Community 15 - "createClient"
Cohesion: 0.19
Nodes (12): ConnectAccountDialog(), ConnectAccountDialogProps, fetchProviders(), providerIcons, ConnectS3Form(), StorageOverviewProps, AllocationSettingsProps, CREDENTIALS_PROVIDERS (+4 more)

### Community 16 - "types.ts"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 17 - "utils.ts"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 18 - "cn"
Cohesion: 0.12
Nodes (21): ButtonProps, buttonVariants, Calendar(), CalendarProps, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader() (+13 more)

### Community 19 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 20 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 21 - "database.ts"
Cohesion: 0.22
Nodes (11): fetchProviders(), ProviderConfigItemProps, ProviderConfigPanel(), ProviderFormState, AccordionContent, AccordionItem, AccordionTrigger, Badge() (+3 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @radix-ui/react-accordion, @radix-ui/react-scroll-area, @radix-ui/react-separator, @radix-ui/react-switch, @radix-ui/react-toggle, shadcn-ui, @supabase/ssr (+7 more)

### Community 23 - "TeraBoxApp"
Cohesion: 0.17
Nodes (7): getChunkSize(), hashBuffer(), TeraboxFileHash, isTransientTeraboxUploadError(), sleep(), TeraboxListEntry, uploadChunkWithRetry()

### Community 24 - "CloudAdapter"
Cohesion: 0.16
Nodes (14): parseViewMode(), SortMode, ViewMode, fetchAccounts(), fetchFolder(), fetchFolderBreadcrumbs(), MyDriveView(), SelectContent (+6 more)

### Community 25 - "terabox.ts"
Cohesion: 0.20
Nodes (16): fetchAccounts(), HomeDashboard(), usagePercent(), StorageOverview(), usagePercent(), Card, CardContent, CardDescription (+8 more)

### Community 27 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 28 - "alert-dialog.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 29 - "upload-dropzone.tsx"
Cohesion: 0.13
Nodes (3): terabox-api, TeraBoxApp, TeraboxListEntry

### Community 31 - "drawer.tsx"
Cohesion: 0.48
Nodes (5): DELETE(), deleteFileMetadataBatched(), GET(), listAccounts(), createAdminClient()

### Community 32 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 33 - "slider.tsx"
Cohesion: 0.21
Nodes (12): cookieOpts(), GET(), oauthRedirect(), PROVIDER_PARAM_MAP, RouteParams, shortError(), waitThenFinalize(), GET() (+4 more)

### Community 34 - "sidebar.tsx"
Cohesion: 0.13
Nodes (9): GOOGLE_EXPORT_MIMES, googleDriveAdapter, SCOPES, s3Adapter, S3Credentials, NormalizedFile, OAuthProviderConfig, ProviderCredentials (+1 more)

### Community 36 - "middleware.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

### Community 37 - "allocation.ts"
Cohesion: 0.21
Nodes (14): GET(), PATCH(), GET(), UploadDestination, advanceRotation(), AllocationConfig, getAllocationConfig(), loadAllocationContext() (+6 more)

### Community 38 - "useLanguage"
Cohesion: 0.24
Nodes (8): ProviderConfigItem(), LoginForm(), RegisterForm(), ProviderSetupCard(), useLanguage(), SettingsPageContent(), fetchSettings(), UserSettings()

### Community 39 - "command.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 40 - "terabox-client.ts"
Cohesion: 0.33
Nodes (9): POST(), buildTeraboxCredentials(), configureTeraboxUndiciTimeouts(), createTeraboxApp(), getTeraboxApiHost(), parseNdusToken(), requireFromHere, TeraboxSessionExtra (+1 more)

### Community 41 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 42 - "allocation-settings.tsx"
Cohesion: 0.20
Nodes (15): fetchUploadDestination(), fetchUploadStatus(), strategyLabelKey(), UploadDestinationPreview(), UploadDropzone(), UploadDropzoneProps, uploadFileWithProgress(), UploadSessionStatus (+7 more)

### Community 46 - "tabs.tsx"
Cohesion: 0.09
Nodes (13): HoverCardContent, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, PopoverContent, RadioGroup, RadioGroupItem (+5 more)

### Community 48 - "getAdapter"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 50 - "sync.ts"
Cohesion: 0.27
Nodes (12): POST(), decryptCredentials(), encryptCredentials(), getKey(), getValidCredentials(), ONEDRIVE_SPECIAL_FOLDERS, Supabase, syncAccountPath() (+4 more)

### Community 64 - "registry.ts"
Cohesion: 0.18
Nodes (5): dropboxAdapter, oneDriveAdapter, adapters, teraboxAdapter, yandexAdapter

### Community 73 - "connect-guide-content.tsx"
Cohesion: 0.14
Nodes (16): ConnectS3FormProps, ConnectTeraboxForm(), ConnectTeraboxFormProps, ConnectGuideContent(), dropboxSteps, getAppUrl(), getProviderRedirectUri(), googleSteps (+8 more)

### Community 75 - "upload.ts"
Cohesion: 0.18
Nodes (12): GET(), POST(), initiateUpload(), processUpload(), Supabase, AccountStatus, AllocationConfig, Database (+4 more)

### Community 76 - "index.ts"
Cohesion: 0.24
Nodes (13): LanguageContext, LanguageContextValue, readStoredLanguage(), en, id, detectBrowserLanguage(), dictionaries, getDictionary() (+5 more)

### Community 98 - "onedrive.ts"
Cohesion: 0.36
Nodes (6): getOneDriveSpecialFolder(), graphFetch(), listChildrenPaginated(), normalizeItem(), OneDriveSpecialFolderName, SCOPES

### Community 101 - "file-explorer.tsx"
Cohesion: 0.12
Nodes (17): fetchFiles(), FileExplorer(), formatFileDate(), parseSortMode(), readStoredSortMode(), readStoredViewMode(), SORT_MODES, sortFiles() (+9 more)

## Knowledge Gaps
- **438 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP`, `RouteParams`, `PROVIDER_PARAM_MAP` (+433 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `carousel.tsx`, `devDependencies`, `date-fns`, `breadcrumb.tsx`, `FileExplorer`, `classnames`, `cmdk`, `embla-carousel-react`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `class-variance-authority`, `@radix-ui/react-select`, `@radix-ui/react-slider`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-dom`, `react-resizable-panels`, `recharts`, `shadcn-ui`, `sonner`, `@supabase/ssr`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `terabox-api`, `vaul`, `zod`, `class-variance-authority`, `hover-card.tsx`, `@radix-ui/react-tabs`, `textarea.tsx`, `react-hook-form`, `dropdown-menu.tsx`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `sidebar.tsx`, `dependencies`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `file-explorer.tsx`, `sidebar.tsx`, `carousel.tsx`, `upload-dropzone.tsx`, `index.ts`, `types.ts`, `utils.ts`, `menubar.tsx`, `database.ts`, `CloudAdapter`, `terabox.ts`, `context-menu.tsx`, `alert-dialog.tsx`, `navigation-menu.tsx`, `command.tsx`, `tabs.tsx`, `getAdapter`, `connect-guide-content.tsx`, `file-explorer.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP` to the rest of the system?**
  _438 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `file-explorer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08502024291497975 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05370101596516691 - nodes in this community are weakly interconnected._
- **Should `TurnixCloud` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._