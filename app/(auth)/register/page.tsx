import { AuthBrand } from "@/components/brand/auth-brand";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <AuthBrand />
      <RegisterForm />
    </div>
  );
}
