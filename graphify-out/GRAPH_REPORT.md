# Graph Report - turnix-cloud  (2026-07-26)

## Corpus Check
- 153 files · ~57,452 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1027 nodes · 1886 edges · 97 communities (44 shown, 53 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1dd19332`
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
- terabox-client.ts
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- onedrive.ts
- input-otp.tsx
- yandex.ts
- middleware.ts
- page.tsx
- accordion.tsx
- avatar.tsx
- extends
- classnames
- clsx
- cmdk
- embla-carousel-react
- framer-motion
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
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-switch
- @radix-ui/react-toggle
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
- file-explorer.tsx
- dropdown-menu.tsx
- file-preview.ts
- toggle-group.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 68 edges
2. `createClient()` - 48 edges
3. `useLanguage()` - 41 edges
4. `getAdapter()` - 26 edges
5. `CloudAdapter` - 21 edges
6. `CloudProvider` - 21 edges
7. `getAccountCredentials()` - 20 edges
8. `TurnixCloud` - 18 edges
9. `Button` - 17 edges
10. `OAUTH_PROVIDERS` - 17 edges

## Surprising Connections (you probably didn't know these)
- `DashboardLayout()` --calls--> `createClient()`  [EXTRACTED]
  app/(dashboard)/layout.tsx → lib/supabase/server.ts
- `AlertDialogHeader()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogFooter()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (97 total, 53 thin omitted)

### Community 0 - "accounts-panel.tsx"
Cohesion: 0.06
Nodes (47): GET(), PROVIDER_PARAM_MAP, RouteParams, PATCH(), PROVIDER_PARAM_MAP, RouteParams, ConnectAccountDialog(), ConnectAccountDialogProps (+39 more)

### Community 1 - "file-explorer.tsx"
Cohesion: 0.23
Nodes (14): FileExplorerProps, FilePreviewDialogProps, fetchAccounts(), fetchFolders(), MoveFileDialog(), MoveFileDialogProps, DialogContent, DialogDescription (+6 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.06
Nodes (44): DashboardLayout(), AppSidebarProps, DashboardShell(), DashboardShellProps, helpNavItems, navItems, SidebarNavItem, Separator (+36 more)

### Community 3 - "TurnixCloud"
Cohesion: 0.04
Nodes (45): 1. Clone and install, 2. Create a Supabase project, 3. Run database migrations, 4. Environment variables, 5. Configure Supabase Auth, 6. Connect a provider (example: Google Drive), Accounts, 🔌 API overview (+37 more)

### Community 4 - "Google OAuth — Production Setup"
Cohesion: 0.05
Nodes (36): 1.1 Environment variables (Vercel / hosting), 1.2 Supabase Auth URLs, 2.1 Redirect URI production, 2.2 Branding & kebijakan (wajib verifikasi), 2.3 Submit App Verification, 2.4 Publish app (In Production), Checklist production, Configure vs Connect (TurnixCloud) (+28 more)

### Community 5 - "carousel.tsx"
Cohesion: 0.05
Nodes (34): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+26 more)

### Community 6 - "OmniCloud"
Cohesion: 0.05
Nodes (40): 1. Create the backend environment file, 1. Install dependencies, 2. Build and start the containers, 2. Create the backend environment file, 3. Fill in the environment variables, 3. Stop the containers, 4. Configure provider credentials, Accounts (+32 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (32): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+24 more)

### Community 8 - "upload-dropzone.tsx"
Cohesion: 0.26
Nodes (11): GET(), PATCH(), GET(), advanceRotation(), getAllocationConfig(), loadAllocationContext(), peekUploadAccount(), pickUploadAccount() (+3 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, next.config.mjs, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 10 - "index.ts"
Cohesion: 0.12
Nodes (22): inter, metadata, ProviderSetupCardProps, applyDocumentLanguage(), LanguageContext, LanguageContextValue, LanguageProvider(), readStoredLanguage() (+14 more)

### Community 11 - "provider-config.ts"
Cohesion: 0.27
Nodes (7): fetchAccounts(), HomeDashboard(), toGb(), StorageChartRow, StorageChartTooltip(), FilePreviewDialog(), formatBytes()

### Community 12 - "getAdapter"
Cohesion: 0.36
Nodes (5): buildTeraboxCredentials(), createTeraboxApp(), getTeraboxApiHost(), parseNdusToken(), TeraboxSessionExtra

### Community 13 - "registry.ts"
Cohesion: 0.06
Nodes (68): POST(), cookieOpts(), GET(), oauthRedirect(), PROVIDER_PARAM_MAP, RouteParams, shortError(), waitThenFinalize() (+60 more)

### Community 14 - "Dropbox — Setup Lengkap"
Cohesion: 0.08
Nodes (26): 1.1 Buka App Console, 1.2 Pilih tipe app, 1.3 Atur permissions (scope), 1.4 Salin App key & App secret, 2.1 Daftarkan di Dropbox, 2.2 Salin dari dashboard TurnixCloud (alternatif), 3.1 Lewat dashboard (disarankan), 3.2 Lewat `.env.local` (fallback) (+18 more)

### Community 16 - "types.ts"
Cohesion: 0.15
Nodes (8): dropboxAdapter, oneDriveAdapter, SCOPES, s3Adapter, S3Credentials, NormalizedFile, OAuthProviderConfig, ProviderCredentials

### Community 17 - "utils.ts"
Cohesion: 0.12
Nodes (9): HoverCardContent, PopoverContent, RadioGroup, RadioGroupItem, ScrollArea, ScrollBar, Slider, Switch (+1 more)

### Community 18 - "cn"
Cohesion: 0.16
Nodes (16): ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem (+8 more)

### Community 19 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 20 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 21 - "database.ts"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): class-variance-authority, next-themes, dependencies, class-variance-authority, next-themes, @radix-ui/react-hover-card, @radix-ui/react-slot, @radix-ui/react-tabs (+7 more)

### Community 23 - "TeraBoxApp"
Cohesion: 0.13
Nodes (3): terabox-api, TeraBoxApp, TeraboxListEntry

### Community 25 - "terabox.ts"
Cohesion: 0.21
Nodes (5): getChunkSize(), hashBuffer(), TeraboxFileHash, teraboxAdapter, TeraboxListEntry

### Community 26 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 27 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 28 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 29 - "terabox-client.ts"
Cohesion: 0.20
Nodes (4): GOOGLE_EXPORT_MIMES, googleDriveAdapter, SCOPES, QuotaInfo

### Community 30 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 31 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 32 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 33 - "onedrive.ts"
Cohesion: 0.06
Nodes (61): AccountsPanel(), fetchAccounts(), fetchProviders(), ConnectS3Form(), ConnectS3FormProps, ConnectTeraboxForm(), ConnectTeraboxFormProps, fetchProviders() (+53 more)

### Community 34 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 36 - "middleware.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, middleware()

### Community 37 - "page.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 39 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 41 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 101 - "file-explorer.tsx"
Cohesion: 0.16
Nodes (11): fetchFiles(), FileExplorer(), Checkbox, Table, TableBody, TableCaption, TableCell, TableFooter (+3 more)

### Community 104 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 106 - "file-preview.ts"
Cohesion: 0.39
Nodes (8): AUDIO_EXTENSIONS, canPreviewFile(), getPreviewKind(), IMAGE_EXTENSIONS, PreviewKind, TEXT_EXTENSIONS, TEXT_MIME_PREFIXES, VIDEO_EXTENSIONS

### Community 107 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

## Knowledge Gaps
- **434 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP`, `RouteParams`, `PROVIDER_PARAM_MAP` (+429 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `carousel.tsx`, `devDependencies`, `createClient`, `accordion.tsx`, `classnames`, `clsx`, `cmdk`, `embla-carousel-react`, `framer-motion`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-dom`, `react-resizable-panels`, `recharts`, `shadcn-ui`, `sonner`, `@supabase/ssr`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `terabox-api`, `vaul`, `zod`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `sidebar.tsx`, `dependencies`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `accounts-panel.tsx`, `file-explorer.tsx`, `sidebar.tsx`, `carousel.tsx`, `utils.ts`, `menubar.tsx`, `database.ts`, `command.tsx`, `context-menu.tsx`, `alert-dialog.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `onedrive.ts`, `input-otp.tsx`, `page.tsx`, `avatar.tsx`, `file-explorer.tsx`, `dropdown-menu.tsx`, `toggle-group.tsx`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP` to the rest of the system?**
  _434 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `accounts-panel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06187202538339503 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05647058823529412 - nodes in this community are weakly interconnected._
- **Should `TurnixCloud` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._