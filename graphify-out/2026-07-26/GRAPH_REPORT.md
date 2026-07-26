# Graph Report - turnix-cloud  (2026-07-26)

## Corpus Check
- 158 files · ~78,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1065 nodes · 2015 edges · 99 communities (47 shown, 52 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e1906d2`
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
- command.tsx
- context-menu.tsx
- alert-dialog.tsx
- upload-dropzone.tsx
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- onedrive.ts
- sidebar.tsx
- FileExplorer
- middleware.ts
- accounts-panel.tsx
- chart.tsx
- command.tsx
- breadcrumb.tsx
- extends
- @aws-sdk/client-s3
- classnames
- tabs.tsx
- cmdk
- embla-carousel-react
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
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-select
- @radix-ui/react-slider
- @radix-ui/react-switch
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
- hover-card.tsx
- slider.tsx
- file-explorer.tsx
- textarea.tsx
- react-hook-form
- dropdown-menu.tsx
- toggle-group.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 77 edges
2. `createClient()` - 48 edges
3. `useLanguage()` - 41 edges
4. `getAdapter()` - 26 edges
5. `getAccountCredentials()` - 22 edges
6. `CloudAdapter` - 21 edges
7. `CloudProvider` - 21 edges
8. `SamarCloud` - 19 edges
9. `Button` - 17 edges
10. `OAUTH_PROVIDERS` - 17 edges

## Surprising Connections (you probably didn't know these)
- `DashboardLayout()` --calls--> `createClient()`  [EXTRACTED]
  app/(dashboard)/layout.tsx → lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  app/api/files/[id]/route.ts → lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  app/api/files/route.ts → lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  app/api/uploads/route.ts → lib/supabase/server.ts
- `ConnectAccountDialogProps` --references--> `CloudAccount`  [EXTRACTED]
  components/accounts/connect-account-dialog.tsx → lib/types/database.ts

## Import Cycles
- None detected.

## Communities (99 total, 52 thin omitted)

### Community 0 - "accounts-panel.tsx"
Cohesion: 0.29
Nodes (8): fetchAccounts(), HomeDashboard(), usagePercent(), StorageOverview(), StorageOverviewProps, usagePercent(), Progress, formatBytes()

### Community 1 - "file-explorer.tsx"
Cohesion: 0.32
Nodes (9): POST(), decryptCredentials(), encryptCredentials(), getKey(), getValidCredentials(), Supabase, syncAccountPath(), SyncResult (+1 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.05
Nodes (48): DashboardLayout(), AppSidebar(), AppSidebarNav(), AppSidebarProps, DashboardShell(), DashboardShellProps, helpNavItems, navItems (+40 more)

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
Nodes (16): GridFileMedia(), FilePreviewDialog(), DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle (+8 more)

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
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 13 - "registry.ts"
Cohesion: 0.13
Nodes (27): GET(), RouteParams, GET(), RouteParams, DELETE(), GET(), PATCH(), RouteParams (+19 more)

### Community 14 - "Dropbox — Setup Lengkap"
Cohesion: 0.08
Nodes (26): 1.1 Buka App Console, 1.2 Pilih tipe app, 1.3 Atur permissions (scope), 1.4 Salin App key & App secret, 2.1 Daftarkan di Dropbox, 2.2 Salin dari dashboard SamarCloud (alternatif), 3.1 Lewat dashboard (disarankan), 3.2 Lewat `.env.local` (fallback) (+18 more)

### Community 16 - "types.ts"
Cohesion: 0.09
Nodes (14): dropboxAdapter, GOOGLE_EXPORT_MIMES, googleDriveAdapter, SCOPES, oneDriveAdapter, SCOPES, adapters, s3Adapter (+6 more)

### Community 17 - "utils.ts"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 18 - "cn"
Cohesion: 0.12
Nodes (22): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), ButtonProps (+14 more)

### Community 19 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 20 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 21 - "database.ts"
Cohesion: 0.14
Nodes (18): ConnectAccountDialog(), ConnectAccountDialogProps, fetchProviders(), providerIcons, ConnectS3Form(), ConnectS3FormProps, ConnectTeraboxForm(), ConnectTeraboxFormProps (+10 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): class-variance-authority, dependencies, class-variance-authority, @radix-ui/react-scroll-area, @radix-ui/react-separator, @radix-ui/react-switch, @radix-ui/react-toggle, shadcn-ui (+7 more)

### Community 23 - "TeraBoxApp"
Cohesion: 0.05
Nodes (14): terabox-api, TeraBoxApp, TeraboxListEntry, buildTeraboxCredentials(), createTeraboxApp(), getTeraboxApiHost(), parseNdusToken(), TeraboxSessionExtra (+6 more)

### Community 24 - "CloudAdapter"
Cohesion: 0.14
Nodes (21): fetchAccounts(), fetchFolders(), MoveFileDialog(), AllocationSettings(), AllocationSettingsProps, fetchAllocation(), STRATEGIES, strategyDescKey() (+13 more)

### Community 25 - "terabox.ts"
Cohesion: 0.17
Nodes (13): fetchProviders(), ProviderConfigItem(), ProviderConfigItemProps, ProviderConfigPanel(), ProviderFormState, AccordionContent, AccordionItem, AccordionTrigger (+5 more)

### Community 26 - "command.tsx"
Cohesion: 0.21
Nodes (13): ProviderSetupCardProps, LanguageContextValue, readStoredLanguage(), en, id, detectBrowserLanguage(), dictionaries, getDictionary() (+5 more)

### Community 27 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 28 - "alert-dialog.tsx"
Cohesion: 0.18
Nodes (12): GET(), POST(), initiateUpload(), processUpload(), Supabase, AccountStatus, AllocationConfig, Database (+4 more)

### Community 29 - "upload-dropzone.tsx"
Cohesion: 0.24
Nodes (12): ActiveUpload, fetchUploadDestination(), fetchUploadStatus(), strategyLabelKey(), UploadDestinationPreview(), UploadDropzone(), UploadDropzoneProps, uploadFileWithProgress() (+4 more)

### Community 31 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 32 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 33 - "onedrive.ts"
Cohesion: 0.21
Nodes (16): ConnectGuideContent(), dropboxSteps, getAppUrl(), getProviderRedirectUri(), googleSteps, teraboxSteps, Card, CardContent (+8 more)

### Community 34 - "sidebar.tsx"
Cohesion: 0.15
Nodes (17): POST(), DELETE(), deleteFileMetadataBatched(), GET(), POST(), GET(), PATCH(), PROVIDER_PARAM_MAP (+9 more)

### Community 35 - "FileExplorer"
Cohesion: 0.17
Nodes (20): GET(), PROVIDER_PARAM_MAP, RouteParams, GET(), getAppUrl(), getOAuthRedirectUri(), OAUTH_PROVIDERS, buildOAuthReturnUrl() (+12 more)

### Community 36 - "middleware.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

### Community 37 - "accounts-panel.tsx"
Cohesion: 0.24
Nodes (8): AccountsPanel(), ConfirmAction, fetchAccounts(), fetchProviders(), isOAuthMessage(), openOAuthPopup(), FILE_QUERY_KEYS, invalidateFileQueries()

### Community 38 - "chart.tsx"
Cohesion: 0.21
Nodes (14): GET(), PATCH(), GET(), UploadDestination, advanceRotation(), AllocationConfig, getAllocationConfig(), loadAllocationContext() (+6 more)

### Community 39 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 40 - "breadcrumb.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 41 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 46 - "tabs.tsx"
Cohesion: 0.09
Nodes (14): Avatar, AvatarFallback, AvatarImage, HoverCardContent, PopoverContent, RadioGroup, RadioGroupItem, ScrollArea (+6 more)

### Community 75 - "@radix-ui/react-switch"
Cohesion: 0.39
Nodes (7): cookieOpts(), GET(), oauthRedirect(), PROVIDER_PARAM_MAP, RouteParams, shortError(), waitThenFinalize()

### Community 101 - "file-explorer.tsx"
Cohesion: 0.09
Nodes (19): fetchFiles(), FileExplorer(), FileExplorerProps, readStoredViewMode(), ViewMode, FilePreviewDialogProps, MoveFileDialogProps, MyDriveView() (+11 more)

### Community 107 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

## Knowledge Gaps
- **438 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP`, `RouteParams`, `PROVIDER_PARAM_MAP` (+433 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `carousel.tsx`, `devDependencies`, `createClient`, `breadcrumb.tsx`, `@aws-sdk/client-s3`, `classnames`, `cmdk`, `embla-carousel-react`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-slider`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-dom`, `react-resizable-panels`, `recharts`, `shadcn-ui`, `sonner`, `@supabase/ssr`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `terabox-api`, `vaul`, `zod`, `class-variance-authority`, `hover-card.tsx`, `slider.tsx`, `textarea.tsx`, `react-hook-form`, `dropdown-menu.tsx`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `sidebar.tsx`, `dependencies`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `accounts-panel.tsx`, `sidebar.tsx`, `carousel.tsx`, `upload-dropzone.tsx`, `index.ts`, `getAdapter`, `utils.ts`, `menubar.tsx`, `database.ts`, `CloudAdapter`, `terabox.ts`, `context-menu.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `onedrive.ts`, `accounts-panel.tsx`, `command.tsx`, `breadcrumb.tsx`, `tabs.tsx`, `file-explorer.tsx`, `toggle-group.tsx`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP` to the rest of the system?**
  _438 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05064935064935065 - nodes in this community are weakly interconnected._
- **Should `TurnixCloud` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Google OAuth — Production Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._