import { AuthBrand } from "@/components/brand/auth-brand";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <AuthBrand />
      <LoginForm />
    </div>
  );
}
