---
name: fix-ui
description: Fix and improve turnix-cloud UI across dialogs, forms, layouts, spacing, states, a11y, and i18n while matching the existing shadcn/new-york design system. Use when the user invokes /fix-ui or asks to fix UI, polish components, repair layout bugs, improve dialogs/forms, or align styling with project patterns.
disable-model-invocation: true
---

# Fix UI (turnix-cloud)

## Goal

Ship UI fixes that match this app’s existing design system. Prefer reuse over invention.

## Stack (do not replace)

- **UI kit**: shadcn/ui `new-york`, RSC-ready, CSS variables, base color `neutral` (`components.json`)
- **Primitives**: `@/components/ui/*` (Button, Dialog, Alert, Select, Input, Form, Sheet, Sidebar, etc.)
- **Class merge**: `cn()` from `@/lib/utils`
- **Icons**: `lucide-react`
- **Toasts**: `sonner` (`toast.success` / `toast.error`)
- **i18n**: `useLanguage()` → `t("...")` from `@/components/providers/language-provider`
- **Data in UI**: TanStack Query (`useQuery` / `useMutation`) when fetching/mutating
- **Tokens**: `app/globals.css` CSS variables (`--primary`, `--muted-foreground`, `--destructive`, sidebar tokens, `.dark`)

## Where UI lives

| Area | Path |
|------|------|
| Primitives | `components/ui/` |
| Files workspace | `components/files/` |
| Accounts / connect | `components/accounts/` |
| Auth forms | `components/auth/` |
| Dashboard | `components/dashboard/` |
| Settings | `components/settings/` |
| Layout / brand / guide | `components/layout/`, `components/brand/`, `components/guide/` |

## Workflow

1. Identify the broken surface (page, dialog, form, empty/loading/error state).
2. Read the nearest existing sibling component before inventing a new pattern.
3. Fix with existing primitives + tokens; keep visual language consistent.
4. Preserve i18n: user-facing copy goes through `t(...)`, not hard-coded English (except rare technical leftovers already present).
5. Verify states: idle, loading, empty, error, disabled, success.
6. Keep changes scoped — no drive-by refactors unrelated to the UI fix.

## Patterns to follow

### Dialogs

Mirror `move-file-dialog.tsx` / `delete-files-dialog.tsx`:

- Controlled `open` / `onOpenChange`
- `DialogHeader` → `DialogTitle` + `DialogDescription`
- Body content, then `DialogFooter`
- Cancel: `Button variant="outline"`
- Destructive confirm: `Button variant="destructive"`
- Primary confirm: default `Button`
- Loading: disable actions + `Loader2` spinner when appropriate
- Errors: `Alert variant="destructive"` and/or `toast.error`
- Success: `toast.success(t("..."))`

### Buttons & density

- Use existing `variant` / `size` from `button.tsx` (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; `default` | `sm` | `lg` | `icon`)
- Icon-only controls: `size="icon"` (often with `className="size-8"` in dense toolbars)
- Keep `gap-2`, `text-sm`, and shadcn radius — don’t invent new button styles

### Forms & inputs

- Prefer `@/components/ui` Input, Label, Select, Switch, Checkbox, Text helpers
- Pair Label with controls; keep spacing with existing Tailwind utility rhythm (`space-y-*`, `gap-*`)
- Validate before submit; surface field/server errors clearly

### Layout & styling

- Compose with Tailwind utilities + CSS variables — avoid one-off hex colors when a token exists
- Use `cn()` for conditional classes
- Respect light/dark tokens already defined in `globals.css`
- Match surrounding spacing/typography in the same feature folder
- Mobile: ensure dialogs/sheets and toolbars remain usable; don’t break existing responsive classes

### Feedback & async

- Loading: skeleton / spinner / disabled buttons (match local pattern)
- Empty states: short copy via `t(...)`, optional icon
- Toasts for completed or failed user actions
- Abort/close behavior: don’t cancel finished work (see move dialog `finishedRef` pattern when relevant)

### Client boundaries

- Interactive UI: `"use client"` at the top
- Keep server components server-side when no hooks/browser APIs are needed

## Do / Don’t

**Do**
- Reuse `components/ui/*` and nearby feature components
- Keep copy in the language system
- Fix accessibility basics: focusable controls, labels, dialog titles, disabled states during mutation

**Don’t**
- Add a new UI library or redesign the whole theme
- Hand-roll buttons/inputs that already exist in `components/ui`
- Hard-code long user-facing strings when `t()` keys exist or belong in i18n
- Expand scope into unrelated backend/API refactors unless required for the UI fix

## Output checklist

Before finishing, confirm:

- [ ] Uses existing shadcn primitives and tokens
- [ ] Loading / empty / error / success handled
- [ ] User-facing strings go through `t(...)` when applicable
- [ ] Dialogs/forms match footer + variant conventions
- [ ] No unrelated refactors

## References

- For primitive inventory and feature map, see [reference.md](reference.md)
