# Shared UI components

Import these from `@/components/<name>`. Form controls accept normal HTML props for their underlying element. Dropdown, dialog, pagination, and toast accept the props listed below.

| Component | Extra props | Responsive behavior |
| --- | --- | --- |
| `AppButton` | `variant`: `primary`, `secondary`, `danger`, `ghost`; `size`: `sm`, `md`, `lg`; `fullWidth`; `loading` | Fits its content by default; `fullWidth` fills its container. Text can wrap on narrow screens. |
| `AppBadge` | `variant`: `neutral`, `success`, `warning`, `danger`; `size`: `sm`, `md` | Stays within its container and wraps long text. |
| `AppInput` | `label`, `hint`, `error`, `containerClassName` | Fills its container without forcing it wider. |
| `AppSelect` | `label`, `hint`, `error`, `containerClassName`; options are passed as children | Fills its container without forcing it wider. Its open option list is styled where the browser supports customizable selects; other browsers use their native list. |
| `AppSkeleton` | `variant`: `text`, `block`, `circle`; `animated`; `width`; `height` | Fills its container by default; accepts custom dimensions and classes. |
| `AppDropdown` | `label`, `ariaLabel`, `disabled`, `items` with `label`, `onSelect`, optional `disabled` and `title` | Opens a floating action menu above the table; options remain reachable on narrow screens. |
| `AppDialog` | `open`, `onOpenChange`, `title`, optional `description` and `dismissible`; content is passed as children | Centers a modal with a backdrop, keyboard focus, Escape and outside-click closing, and a scrollable body on small screens. |
| `AppPagination` | `page`, `totalPages`, `total`, `onPageChange`, optional `label`, `itemName`, and `disabled` | Previous and Next buttons wrap beneath the page summary on narrow screens. |
| `AppToaster` | `message`, `variant`: `success` or `error`, `onClose` | Shows a dismissible message at the bottom of the viewport; closes after five seconds. |

Example:

```tsx
import { AppBadge } from "@/components/AppBadge";
import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppSelect } from "@/components/AppSelect";
import { AppSkeleton } from "@/components/AppSkeleton";

<div className="grid gap-4 sm:grid-cols-2">
  <AppInput label="Email" type="email" name="email" required />
  <AppSelect label="Role" name="role" defaultValue="MEMBER">
    <option value="ADMIN">Admin</option>
    <option value="MEMBER">Member</option>
  </AppSelect>
  <AppBadge variant="success">Active</AppBadge>
  <AppButton type="submit" fullWidth>Save</AppButton>
  <AppSkeleton variant="block" height="6rem" />
</div>
```

`AppButton` defaults to `type="button"`; set `type="submit"` in a form. Inputs and selects link `label`, `hint`, and `error` to the control for accessibility. If you omit `label`, provide an `aria-label` or `aria-labelledby`.

Skeletons are decorative. Put a screen-reader loading message on the surrounding container, for example `<div role="status"><span className="sr-only">Loading…</span><AppSkeleton /></div>`.
