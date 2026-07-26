# Graph Report - turnix-cloud  (2026-07-26)

## Corpus Check
- 159 files · ~80,801 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1080 nodes · 2073 edges · 101 communities (44 shown, 57 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca771b88`
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
- context-menu.tsx
- alert-dialog.tsx
- upload-dropzone.tsx
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- sidebar.tsx
- FileExplorer
- middleware.ts
- chart.tsx
- command.tsx
- breadcrumb.tsx
- extends
- @aws-sdk/client-s3
- classnames
- tabs.tsx
- cmdk
- textarea.tsx
- embla-carousel-react
- dropbox.ts
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
- class-variance-authority
- @radix-ui/react-select
- @radix-ui/react-slider
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
- hover-card.tsx
- slider.tsx
- file-explorer.tsx
- textarea.tsx
- react-hook-form
- dropdown-menu.tsx
- terabox-client.ts
- avatar.tsx
- scroll-area.tsx

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
- `DashboardLayout()` --calls--> `createClient()`  [EXTRACTED]
  app/(dashboard)/layout.tsx → lib/supabase/server.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts
- `CommandShortcut()` --calls--> `cn()`  [EXTRACTED]
  components/ui/command.tsx → lib/utils.ts
- `ContextMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  components/ui/context-menu.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (101 total, 57 thin omitted)

### Community 0 - "accounts-panel.tsx"
Cohesion: 0.22
Nodes (15): FileExplorerProps, FilePreviewDialogProps, fetchAccounts(), fetchFolders(), MoveFileDialog(), MoveFileDialogProps, DialogContent, DialogDescription (+7 more)

### Community 1 - "file-explorer.tsx"
Cohesion: 0.18
Nodes (15): ActiveUpload, fetchUploadDestination(), fetchUploadStatus(), strategyLabelKey(), UploadDestination, UploadDestinationPreview(), UploadDropzone(), UploadDropzoneProps (+7 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.05
Nodes (46): DashboardLayout(), AppSidebar(), AppSidebarNav(), AppSidebarProps, DashboardShell(), DashboardShellProps, helpNavItems, navItems (+38 more)

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

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, next.config.mjs, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 10 - "index.ts"
Cohesion: 0.10
Nodes (12): inter, metadata, OAuthDoneClient(), AuthBrand(), SamarLogo(), SamarLogoProps, SamarLogoVariant, Providers() (+4 more)

### Community 11 - "provider-config.ts"
Cohesion: 0.29
Nodes (9): decryptWith(), deriveKey(), __dirname, dryRun, encryptWith(), main(), reencryptField(), root (+1 more)

### Community 13 - "registry.ts"
Cohesion: 0.05
Nodes (86): POST(), cookieOpts(), GET(), oauthRedirect(), PROVIDER_PARAM_MAP, RouteParams, shortError(), waitThenFinalize() (+78 more)

### Community 14 - "Dropbox — Setup Lengkap"
Cohesion: 0.08
Nodes (26): 1.1 Buka App Console, 1.2 Pilih tipe app, 1.3 Atur permissions (scope), 1.4 Salin App key & App secret, 2.1 Daftarkan di Dropbox, 2.2 Salin dari dashboard SamarCloud (alternatif), 3.1 Lewat dashboard (disarankan), 3.2 Lewat `.env.local` (fallback) (+18 more)

### Community 16 - "types.ts"
Cohesion: 0.20
Nodes (4): adapters, s3Adapter, teraboxAdapter, yandexAdapter

### Community 18 - "cn"
Cohesion: 0.14
Nodes (17): ButtonProps, buttonVariants, Calendar(), CalendarProps, HoverCardContent, Pagination(), PaginationContent, PaginationEllipsis() (+9 more)

### Community 19 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 20 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 21 - "database.ts"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): date-fns, dependencies, date-fns, @radix-ui/react-scroll-area, @radix-ui/react-separator, @radix-ui/react-switch, @radix-ui/react-toggle, shadcn-ui (+7 more)

### Community 23 - "TeraBoxApp"
Cohesion: 0.12
Nodes (3): terabox-api, TeraBoxApp, TeraboxListEntry

### Community 24 - "CloudAdapter"
Cohesion: 0.20
Nodes (11): fetchAccounts(), fetchFolder(), fetchFolderBreadcrumbs(), MyDriveView(), SelectContent, SelectItem, SelectLabel, SelectScrollDownButton (+3 more)

### Community 25 - "terabox.ts"
Cohesion: 0.05
Nodes (74): AccountsPanel(), ConfirmAction, fetchAccounts(), fetchProviders(), ConnectS3Form(), ConnectS3FormProps, ConnectTeraboxForm(), ConnectTeraboxFormProps (+66 more)

### Community 27 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 28 - "alert-dialog.tsx"
Cohesion: 0.26
Nodes (11): GET(), PATCH(), GET(), advanceRotation(), getAllocationConfig(), loadAllocationContext(), peekUploadAccount(), pickUploadAccount() (+3 more)

### Community 29 - "upload-dropzone.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 31 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 32 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 35 - "FileExplorer"
Cohesion: 0.21
Nodes (12): ConnectAccountDialog(), ConnectAccountDialogProps, fetchProviders(), providerIcons, StorageOverviewProps, AllocationSettingsProps, CREDENTIALS_PROVIDERS, isOAuthMessage() (+4 more)

### Community 36 - "middleware.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

### Community 38 - "chart.tsx"
Cohesion: 0.29
Nodes (6): AccountStatus, AllocationConfig, Database, Json, Profile, UploadStatus

### Community 39 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 40 - "breadcrumb.tsx"
Cohesion: 0.20
Nodes (4): GOOGLE_EXPORT_MIMES, googleDriveAdapter, SCOPES, QuotaInfo

### Community 41 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 42 - "@aws-sdk/client-s3"
Cohesion: 0.24
Nodes (4): getChunkSize(), hashBuffer(), TeraboxFileHash, TeraboxListEntry

### Community 46 - "tabs.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 48 - "textarea.tsx"
Cohesion: 0.32
Nodes (6): graphFetch(), listChildrenPaginated(), normalizeItem(), oneDriveAdapter, OneDriveSpecialFolderName, SCOPES

### Community 50 - "dropbox.ts"
Cohesion: 0.24
Nodes (5): dropboxAdapter, S3Credentials, NormalizedFile, OAuthProviderConfig, ProviderCredentials

### Community 76 - "index.ts"
Cohesion: 0.20
Nodes (16): ProviderSetupCardProps, applyDocumentLanguage(), LanguageContext, LanguageContextValue, LanguageProvider(), readStoredLanguage(), en, id (+8 more)

### Community 101 - "file-explorer.tsx"
Cohesion: 0.05
Nodes (41): fetchFiles(), FileExplorer(), GridFileMedia(), readStoredSortMode(), readStoredViewMode(), SORT_MODES, sortFiles(), SortMode (+33 more)

### Community 109 - "terabox-client.ts"
Cohesion: 0.42
Nodes (6): buildTeraboxCredentials(), createTeraboxApp(), getTeraboxApiHost(), parseNdusToken(), TeraboxSessionExtra, withTimeout()

### Community 110 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps
- **440 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP`, `RouteParams`, `PROVIDER_PARAM_MAP` (+435 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `carousel.tsx`, `devDependencies`, `getAdapter`, `breadcrumb.tsx`, `classnames`, `cmdk`, `embla-carousel-react`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `class-variance-authority`, `@radix-ui/react-select`, `@radix-ui/react-slider`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-dom`, `react-resizable-panels`, `recharts`, `shadcn-ui`, `sonner`, `@supabase/ssr`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `terabox-api`, `vaul`, `zod`, `class-variance-authority`, `hover-card.tsx`, `slider.tsx`, `textarea.tsx`, `react-hook-form`, `dropdown-menu.tsx`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `sidebar.tsx`, `dependencies`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `accounts-panel.tsx`, `sidebar.tsx`, `carousel.tsx`, `upload-dropzone.tsx`, `index.ts`, `createClient`, `utils.ts`, `menubar.tsx`, `database.ts`, `CloudAdapter`, `terabox.ts`, `context-menu.tsx`, `upload-dropzone.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `command.tsx`, `tabs.tsx`, `file-explorer.tsx`, `avatar.tsx`, `scroll-area.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP` to the rest of the system?**
  _440 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05279034690799397 - nodes in this community are weakly interconnected._
- **Should `TurnixCloud` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Google OAuth — Production Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._