# Graph Report - turnix-cloud  (2026-07-26)

## Corpus Check
- 157 files · ~78,060 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1059 nodes · 1993 edges · 106 communities (48 shown, 58 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `de8693d2`
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
- sidebar.tsx
- FileExplorer
- middleware.ts
- form.tsx
- chart.tsx
- sheet.tsx
- breadcrumb.tsx
- extends
- react
- avatar.tsx
- classnames
- tabs.tsx
- cmdk
- radio-group.tsx
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
- class-variance-authority
- @aws-sdk/client-s3
- hover-card.tsx
- slider.tsx
- file-explorer.tsx
- textarea.tsx
- dropdown-menu.tsx
- file-preview.ts
- toggle-group.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 75 edges
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
- `AlertDialogHeader()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogFooter()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  components/ui/breadcrumb.tsx → lib/utils.ts
- `CommandShortcut()` --calls--> `cn()`  [EXTRACTED]
  components/ui/command.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (106 total, 58 thin omitted)

### Community 0 - "accounts-panel.tsx"
Cohesion: 0.06
Nodes (58): PROVIDER_PARAM_MAP, RouteParams, PATCH(), PROVIDER_PARAM_MAP, RouteParams, AccountsPanel(), fetchAccounts(), fetchProviders() (+50 more)

### Community 1 - "file-explorer.tsx"
Cohesion: 0.20
Nodes (12): FileExplorerProps, FilePreviewDialog(), FilePreviewDialogProps, MoveFileDialogProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+4 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.11
Nodes (17): AppSidebarProps, DashboardShellProps, helpNavItems, navItems, SidebarNavItem, Sidebar, SidebarContent, SidebarFooter (+9 more)

### Community 3 - "TurnixCloud"
Cohesion: 0.04
Nodes (47): 1. Clone and install, 2. Create a Supabase project, 3. Run database migrations, 4. Environment variables, 5. Configure Supabase Auth, 6. Connect a provider (example: Google Drive), Accounts, 🔌 API overview (+39 more)

### Community 4 - "Google OAuth — Production Setup"
Cohesion: 0.05
Nodes (36): 1.1 Environment variables (Vercel / hosting), 1.2 Supabase Auth URLs, 2.1 Redirect URI production, 2.2 Branding & kebijakan (wajib verifikasi), 2.3 Submit App Verification, 2.4 Publish app (In Production), Checklist production, Configure vs Connect (SamarCloud) (+28 more)

### Community 5 - "carousel.tsx"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 6 - "OmniCloud"
Cohesion: 0.05
Nodes (40): 1. Create the backend environment file, 1. Install dependencies, 2. Build and start the containers, 2. Create the backend environment file, 3. Fill in the environment variables, 3. Stop the containers, 4. Configure provider credentials, Accounts (+32 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (33): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+25 more)

### Community 8 - "upload-dropzone.tsx"
Cohesion: 0.14
Nodes (20): ProviderSetupCardProps, applyDocumentLanguage(), LanguageContext, LanguageContextValue, LanguageProvider(), readStoredLanguage(), Providers(), ProvidersProps (+12 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, next.config.mjs, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 10 - "index.ts"
Cohesion: 0.12
Nodes (10): inter, metadata, OAuthDoneClient(), LoginForm(), RegisterForm(), AuthBrand(), SamarLogo(), SamarLogoProps (+2 more)

### Community 11 - "provider-config.ts"
Cohesion: 0.29
Nodes (9): decryptWith(), deriveKey(), __dirname, dryRun, encryptWith(), main(), reencryptField(), root (+1 more)

### Community 12 - "getAdapter"
Cohesion: 0.52
Nodes (5): buildTeraboxCredentials(), createTeraboxApp(), getTeraboxApiHost(), parseNdusToken(), TeraboxSessionExtra

### Community 13 - "registry.ts"
Cohesion: 0.05
Nodes (77): POST(), cookieOpts(), GET(), oauthRedirect(), PROVIDER_PARAM_MAP, RouteParams, shortError(), waitThenFinalize() (+69 more)

### Community 14 - "Dropbox — Setup Lengkap"
Cohesion: 0.08
Nodes (26): 1.1 Buka App Console, 1.2 Pilih tipe app, 1.3 Atur permissions (scope), 1.4 Salin App key & App secret, 2.1 Daftarkan di Dropbox, 2.2 Salin dari dashboard SamarCloud (alternatif), 3.1 Lewat dashboard (disarankan), 3.2 Lewat `.env.local` (fallback) (+18 more)

### Community 16 - "types.ts"
Cohesion: 0.15
Nodes (8): dropboxAdapter, adapters, s3Adapter, S3Credentials, NormalizedFile, OAuthProviderConfig, ProviderCredentials, yandexAdapter

### Community 17 - "utils.ts"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

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
Cohesion: 0.20
Nodes (4): GOOGLE_EXPORT_MIMES, googleDriveAdapter, SCOPES, QuotaInfo

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): class-variance-authority, next-themes, dependencies, class-variance-authority, next-themes, @radix-ui/react-hover-card, @radix-ui/react-slot, @radix-ui/react-tabs (+7 more)

### Community 23 - "TeraBoxApp"
Cohesion: 0.12
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

### Community 31 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 32 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 33 - "onedrive.ts"
Cohesion: 0.06
Nodes (68): ConnectAccountDialogProps, ConnectS3Form(), ConnectS3FormProps, ConnectTeraboxForm(), ConnectTeraboxFormProps, ProviderConfigItem(), ProviderConfigItemProps, ProviderFormState (+60 more)

### Community 34 - "sidebar.tsx"
Cohesion: 0.12
Nodes (15): SidebarContext, SidebarContextProps, SidebarGroupAction, SidebarInput, SidebarInset, SidebarMenuAction, SidebarMenuBadge, sidebarMenuButtonVariants (+7 more)

### Community 35 - "FileExplorer"
Cohesion: 0.17
Nodes (4): fetchFiles(), FileExplorer(), readStoredViewMode(), MyDriveView()

### Community 36 - "middleware.ts"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

### Community 37 - "form.tsx"
Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 38 - "chart.tsx"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 39 - "sheet.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 40 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 41 - "extends"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 42 - "react"
Cohesion: 0.25
Nodes (7): useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react, react

### Community 44 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 46 - "tabs.tsx"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 101 - "file-explorer.tsx"
Cohesion: 0.20
Nodes (10): ViewMode, Checkbox, Table, TableBody, TableCaption, TableCell, TableFooter, TableHead (+2 more)

### Community 104 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 106 - "file-preview.ts"
Cohesion: 0.33
Nodes (9): GridFileMedia(), AUDIO_EXTENSIONS, canPreviewFile(), getPreviewKind(), IMAGE_EXTENSIONS, PreviewKind, TEXT_EXTENSIONS, TEXT_MIME_PREFIXES (+1 more)

### Community 107 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

## Knowledge Gaps
- **441 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP`, `RouteParams`, `PROVIDER_PARAM_MAP` (+436 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `createClient`, `breadcrumb.tsx`, `react`, `classnames`, `cmdk`, `embla-carousel-react`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-dom`, `react-resizable-panels`, `recharts`, `shadcn-ui`, `sonner`, `@supabase/ssr`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `@tanstack/react-table`, `terabox-api`, `vaul`, `zod`, `class-variance-authority`, `@aws-sdk/client-s3`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dependencies`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `accounts-panel.tsx`, `file-explorer.tsx`, `carousel.tsx`, `index.ts`, `utils.ts`, `menubar.tsx`, `command.tsx`, `context-menu.tsx`, `alert-dialog.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `onedrive.ts`, `sidebar.tsx`, `FileExplorer`, `form.tsx`, `chart.tsx`, `sheet.tsx`, `breadcrumb.tsx`, `avatar.tsx`, `tabs.tsx`, `radio-group.tsx`, `framer-motion`, `hover-card.tsx`, `slider.tsx`, `file-explorer.tsx`, `textarea.tsx`, `dropdown-menu.tsx`, `file-preview.ts`, `toggle-group.tsx`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `PROVIDER_PARAM_MAP` to the rest of the system?**
  _441 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `accounts-panel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06377151799687011 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `TurnixCloud` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._