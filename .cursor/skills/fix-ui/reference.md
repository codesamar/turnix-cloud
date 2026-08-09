# fix-ui reference

## shadcn config

From `components.json`:

- style: `new-york`
- rsc: `true`
- baseColor: `neutral`
- cssVariables: `true`
- css: `app/globals.css`
- aliases: `@/components`, `@/components/ui`, `@/lib/utils`, `@/hooks`
- icons: `lucide`

## Common primitives (`components/ui/`)

Alert, AlertDialog, Button, Card, Checkbox, Dialog, DropdownMenu, Form, Input, Label, Progress, Select, Sheet, Sidebar, Skeleton, Sonner, Switch, Table, Tabs, Textarea, Tooltip, and related overlays (Popover, HoverCard, Drawer).

Add new primitives via the project’s existing shadcn workflow — do not copy random third-party components.

## Feature examples to copy from

| Need | Start here |
|------|------------|
| Multi-step / folder dialog | `components/files/move-file-dialog.tsx` |
| Destructive confirm | `components/files/delete-files-dialog.tsx` |
| File table + toolbar | `components/files/file-explorer.tsx` |
| Upload feedback | `components/files/upload-dropzone.tsx` |
| Connect account UI | `components/accounts/connect-account-dialog.tsx` |
| Provider settings form | `components/accounts/provider-config-panel.tsx` |
| Auth forms | `components/auth/login-form.tsx`, `register-form.tsx` |

## i18n

- Hook: `useLanguage()` in `@/components/providers/language-provider`
- Usage: `const { t } = useLanguage();` then `t("namespace.key")`
- When adding copy, follow existing key style in the language files used by that provider

## Toast

```tsx
import { toast } from "sonner";

toast.success(t("move.success"));
toast.error(error.message);
```

## Dialog skeleton

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t("...")}</DialogTitle>
      <DialogDescription>{t("...")}</DialogDescription>
    </DialogHeader>
    {/* body */}
    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        {t("common.cancel")}
      </Button>
      <Button disabled={isPending}>{t("common.confirm")}</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

(Use real keys from nearby components; adjust cancel/confirm keys to match local i18n.)
