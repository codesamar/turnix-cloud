import { SamarLogo } from "@/components/brand/samar-logo";

/** Brand block for login / register — mark + wordmark above the form. */
export function AuthBrand() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <SamarLogo variant="lockup" height={48} priority className="justify-center" />
    </div>
  );
}
