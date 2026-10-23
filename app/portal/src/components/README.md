# Shared UI components

Import these from `@/components/<name>`. They accept the normal HTML props for their underlying element, including `className`, `disabled`, event handlers, and `aria-*` attributes.

| Component | Extra props | Responsive behavior |
| --- | --- | --- |
| `AppButton` | `variant`: `primary`, `secondary`, `danger`, `ghost`; `size`: `sm`, `md`, `lg`; `fullWidth`; `loading` | Fits its content by default; `fullWidth` fills its container. Text can wrap on narrow screens. |
| `AppBadge` | `variant`: `neutral`, `success`, `warning`, `danger`; `size`: `sm`, `md` | Stays within its container and wraps long text. |
| `AppInput` | `label`, `hint`, `error`, `containerClassName` | Fills its container without forcing it wider. |
| `AppSelect` | `label`, `hint`, `error`, `containerClassName`; options are passed as children | Fills its container without forcing it wider. |
| `AppSkeleton` | `variant`: `text`, `block`, `circle`; `animated`; `width`; `height` | Fills its container by default; accepts custom dimensions and classes. |

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
