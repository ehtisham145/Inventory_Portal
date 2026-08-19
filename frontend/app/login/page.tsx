"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/lib/api";
import { roleHomePath } from "@/lib/jwt";
import { isValidEmail } from "@/utils/validators";

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const user = await login(email, password, remember);
      router.replace(roleHomePath(user.role));
    } catch (error) {
      showToast(extractErrorMessage(error) || "Invalid credentials", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="md" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="you@company.com"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
            />
            Remember me on this device
          </label>
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Log In
          </Button>
        </form>
      </div>
    </div>
  );
}
