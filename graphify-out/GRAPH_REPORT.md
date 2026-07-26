# Graph Report - turnix-cloud  (2026-07-26)

## Corpus Check
- 159 files · ~81,778 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1090 nodes · 2099 edges · 122 communities (63 shown, 59 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `57d8275a`
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
- getPreviewKind
- command.tsx
- accounts.ts
- drawer.tsx
- Troubleshooting
- Langkah 1 — Buat app di Dropbox App Console
- Langkah 2 — Google Cloud Console
- buttonVariants
- radio-group.tsx
- scroll-area.tsx
- Langkah 3 — Configure di SamarCloud
- Development vs Production
- hover-card.tsx
- slider.tsx
- textarea.tsx
- @radix-ui/react-accordion

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
  app/api/uploads/route.ts → lib/supabase/server.ts
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

## Communities (122 total, 59 thin omitted)

### Community 0 - "accounts-panel.tsx"
Cohesion: 0.09
Nodes (38): GET(), PROVIDER_PARAM_MAP, RouteParams, PATCH(), PROVIDER_PARAM_MAP, RouteParams, ConnectAccountDialog(), fetchProviders() (+30 more)

### Community 1 - "file-explorer.tsx"
Cohesion: 0.20
Nodes (12): FileExplorerProps, FilePreviewDialog(), FilePreviewDialogProps, MoveFileDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+4 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.06
Nodes (45): AppSidebar(), AppSidebarNav(), AppSidebarProps, DashboardShellProps, helpNavItems, navItems, SidebarNavItem, SignOutButton() (+37 more)

### Community 3 - "TurnixCloud"
Cohesion: 0.04
Nodes (47): 1. Clone and install, 2. Create a Supabase project, 3. Run database migrations, 4. Environment variables, 5. Configure Supabase Auth, 6. Connect a provider (example: Google Drive), Accounts, 🔌 API overview (+39 more)

### Community 4 - "Google OAuth — Production Setup"
Cohesion: 0.15
Nodes (13): 1.1 Environment variables (Vercel / hosting), 1.2 Supabase Auth URLs, Checklist production, Configure vs Connect (SamarCloud), Dev vs Production — dua OAuth client (disarankan), Diagram alur production, Google OAuth — Production Setup, Langkah 1 — Deploy SamarCloud (+5 more)

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
Cohesion: 0.09
Nodes (16): inter, metadata, OAuthDoneClient(), LoginForm(), RegisterForm(), AuthBrand(), SamarLogo(), SamarLogoProps (+8 more)

### Community 11 - "provider-config.ts"
Cohesion: 0.29
Nodes (9): decryptWith(), deriveKey(), __dirname, dryRun, encryptWith(), main(), reencryptField(), root (+1 more)

### Community 12 - "getAdapter"
Cohesion: 0.16
Nodes (20): GET(), RouteParams, GET(), RouteParams, DELETE(), PATCH(), RouteParams, POST() (+12 more)

### Community 13 - "registry.ts"
Cohesion: 0.14
Nodes (15): DELETE(), deleteFileMetadataBatched(), GET(), GET(), GET(), GET(), GET(), GET() (+7 more)

### Community 14 - "Dropbox — Setup Lengkap"
Cohesion: 0.13
Nodes (15): 2.1 Daftarkan di Dropbox, 2.2 Salin dari dashboard SamarCloud (alternatif), Cek Redirect URI, Configure vs Connect, Deploy production (Vercel), Diagram alur, Dropbox — Setup Lengkap, Langkah 2 — Set Redirect URI (+7 more)

### Community 15 - "createClient"
Cohesion: 0.30
Nodes (11): ConnectS3Form(), ConnectS3FormProps, Button, Card, CardContent, CardDescription, CardFooter, CardHeader (+3 more)

### Community 16 - "types.ts"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 17 - "utils.ts"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 18 - "cn"
Cohesion: 0.18
Nodes (13): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+5 more)

### Community 19 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 20 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 21 - "database.ts"
Cohesion: 0.18
Nodes (12): fetchProviders(), ProviderConfigItem(), ProviderConfigItemProps, ProviderConfigPanel(), ProviderFormState, AccordionContent, AccordionItem, AccordionTrigger (+4 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): @aws-sdk/client-s3, dependencies, @aws-sdk/client-s3, @radix-ui/react-scroll-area, @radix-ui/react-separator, @radix-ui/react-switch, @radix-ui/react-toggle, shadcn-ui (+7 more)

### Community 23 - "TeraBoxApp"
Cohesion: 0.13
Nodes (10): getChunkSize(), hashBuffer(), TeraboxFileHash, isTransientTeraboxUploadError(), normalizeEntry(), resolveUploadedFile(), sleep(), teraboxAdapter (+2 more)

### Community 24 - "CloudAdapter"
Cohesion: 0.15
Nodes (17): parseViewMode(), fetchAccounts(), fetchFolders(), MoveFileDialog(), fetchAccounts(), fetchFolder(), fetchFolderBreadcrumbs(), MyDriveView() (+9 more)

### Community 25 - "terabox.ts"
Cohesion: 0.19
Nodes (12): ConnectAccountDialogProps, fetchAccounts(), HomeDashboard(), usagePercent(), StorageOverview(), StorageOverviewProps, usagePercent(), AllocationSettingsProps (+4 more)

### Community 27 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 28 - "alert-dialog.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 29 - "upload-dropzone.tsx"
Cohesion: 0.17
Nodes (3): terabox-api, TeraBoxApp, TeraboxListEntry

### Community 31 - "drawer.tsx"
Cohesion: 0.22
Nodes (11): ConnectTeraboxForm(), ConnectTeraboxFormProps, AllocationSettings(), fetchAllocation(), STRATEGIES, strategyDescKey(), strategyLabelKey(), Alert (+3 more)

### Community 32 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 33 - "slider.tsx"
Cohesion: 0.39
Nodes (7): cookieOpts(), GET(), oauthRedirect(), PROVIDER_PARAM_MAP, RouteParams, shortError(), waitThenFinalize()

### Community 34 - "sidebar.tsx"
Cohesion: 0.12
Nodes (10): dropboxAdapter, GOOGLE_EXPORT_MIMES, googleDriveAdapter, SCOPES, s3Adapter, S3Credentials, NormalizedFile, OAuthProviderConfig (+2 more)

### Community 36 - "middleware.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

### Community 37 - "allocation.ts"
Cohesion: 0.15
Nodes (19): GET(), PATCH(), GET(), GET(), POST(), UploadDestination, advanceRotation(), AllocationConfig (+11 more)

### Community 38 - "useLanguage"
Cohesion: 0.43
Nodes (4): useLanguage(), SettingsPageContent(), fetchSettings(), UserSettings()

### Community 39 - "command.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 40 - "terabox-client.ts"
Cohesion: 0.27
Nodes (8): buildTeraboxCredentials(), configureTeraboxUndiciTimeouts(), createTeraboxApp(), getTeraboxApiHost(), parseNdusToken(), requireFromHere, TeraboxSessionExtra, withTimeout()

### Community 41 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 42 - "allocation-settings.tsx"
Cohesion: 0.27
Nodes (11): fetchUploadDestination(), fetchUploadStatus(), strategyLabelKey(), UploadDestinationPreview(), UploadDropzone(), UploadDropzoneProps, uploadFileWithProgress(), UploadSessionStatus (+3 more)

### Community 46 - "tabs.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 48 - "getAdapter"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 50 - "sync.ts"
Cohesion: 0.21
Nodes (15): POST(), POST(), POST(), saveAccount(), decryptCredentials(), encryptCredentials(), getKey(), getValidCredentials() (+7 more)

### Community 56 - "@radix-ui/react-accordion"
Cohesion: 0.17
Nodes (12): Method A: Application / Cookies tab (easiest), Method B: Network tab, Multiple accounts, Prerequisites, Related, Security, Step 1 — Log in to TeraBox, Step 2 — Copy the NDUS token (+4 more)

### Community 73 - "connect-guide-content.tsx"
Cohesion: 0.19
Nodes (12): ConnectGuideContent(), dropboxSteps, getAppUrl(), getProviderRedirectUri(), googleSteps, ProviderSetupCard(), ProviderSetupCardProps, teraboxSteps (+4 more)

### Community 75 - "upload.ts"
Cohesion: 0.18
Nodes (5): fetchFiles(), FileExplorer(), formatFileDate(), readStoredViewMode(), sortFiles()

### Community 76 - "index.ts"
Cohesion: 0.26
Nodes (9): readStoredLanguage(), en, id, detectBrowserLanguage(), dictionaries, getDictionary(), isLanguage(), translate() (+1 more)

### Community 98 - "onedrive.ts"
Cohesion: 0.31
Nodes (7): getOneDriveSpecialFolder(), graphFetch(), listChildrenPaginated(), normalizeItem(), oneDriveAdapter, OneDriveSpecialFolderName, SCOPES

### Community 101 - "file-explorer.tsx"
Cohesion: 0.16
Nodes (14): parseSortMode(), readStoredSortMode(), SORT_MODES, SortMode, ViewMode, Checkbox, Table, TableBody (+6 more)

### Community 105 - "getPreviewKind"
Cohesion: 0.33
Nodes (9): GridFileMedia(), AUDIO_EXTENSIONS, canPreviewFile(), getPreviewKind(), IMAGE_EXTENSIONS, PreviewKind, TEXT_EXTENSIONS, TEXT_MIME_PREFIXES (+1 more)

### Community 106 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 107 - "accounts.ts"
Cohesion: 0.36
Nodes (6): Supabase, AccountDisconnectedError, classifyAccountError(), isAccountDisconnectedError(), isTokenExpiredError(), toAccountApiError()

### Community 108 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 109 - "Troubleshooting"
Cohesion: 0.33
Nodes (6): "Configured" tapi tidak bisa connect, Error 403: access_denied, File tidak muncul setelah connect, Google hasn't verified this app, redirect_uri_mismatch, Troubleshooting

### Community 111 - "Langkah 1 — Buat app di Dropbox App Console"
Cohesion: 0.40
Nodes (5): 1.1 Buka App Console, 1.2 Pilih tipe app, 1.3 Atur permissions (scope), 1.4 Salin App key & App secret, Langkah 1 — Buat app di Dropbox App Console

### Community 112 - "Langkah 2 — Google Cloud Console"
Cohesion: 0.40
Nodes (5): 2.1 Redirect URI production, 2.2 Branding & kebijakan (wajib verifikasi), 2.3 Submit App Verification, 2.4 Publish app (In Production), Langkah 2 — Google Cloud Console

### Community 113 - "buttonVariants"
Cohesion: 0.67
Nodes (3): buttonVariants, Calendar(), CalendarProps

### Community 116 - "Langkah 3 — Configure di SamarCloud"
Cohesion: 0.67
Nodes (3): 3.1 Lewat dashboard (disarankan), 3.2 Lewat `.env.local` (fallback), Langkah 3 — Configure di SamarCloud

### Community 117 - "Development vs Production"
Cohesion: 0.67
Nodes (3): Development — izinkan user lain connect, Development vs Production, Production — Apply for Production

## Knowledge Gaps
- **438 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP`, `RouteParams`, `PROVIDER_PARAM_MAP` (+433 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `carousel.tsx`, `devDependencies`, `date-fns`, `breadcrumb.tsx`, `FileExplorer`, `classnames`, `cmdk`, `embla-carousel-react`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `class-variance-authority`, `@radix-ui/react-select`, `@radix-ui/react-slider`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-dom`, `react-resizable-panels`, `recharts`, `shadcn-ui`, `sonner`, `@supabase/ssr`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `terabox-api`, `vaul`, `zod`, `class-variance-authority`, `hover-card.tsx`, `@radix-ui/react-tabs`, `textarea.tsx`, `react-hook-form`, `dropdown-menu.tsx`, `@radix-ui/react-accordion`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `sidebar.tsx`, `dependencies`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `file-explorer.tsx`, `sidebar.tsx`, `carousel.tsx`, `upload-dropzone.tsx`, `index.ts`, `createClient`, `types.ts`, `utils.ts`, `menubar.tsx`, `database.ts`, `CloudAdapter`, `terabox.ts`, `context-menu.tsx`, `alert-dialog.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `command.tsx`, `tabs.tsx`, `getAdapter`, `upload.ts`, `file-explorer.tsx`, `getPreviewKind`, `command.tsx`, `drawer.tsx`, `buttonVariants`, `radio-group.tsx`, `scroll-area.tsx`, `hover-card.tsx`, `slider.tsx`, `textarea.tsx`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP` to the rest of the system?**
  _438 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `accounts-panel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09393939393939393 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05568627450980392 - nodes in this community are weakly interconnected._
- **Should `TurnixCloud` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._