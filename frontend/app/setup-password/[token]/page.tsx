"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { extractErrorMessage } from "@/lib/api";
import { InviteInfo, getInviteInfo, setInvitePassword } from "@/services/invite";

type ViewState = "loading" | "ready" | "error" | "done";

export default function SetupPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [state, setState] = useState<ViewState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [invite, setInvite] = useState<InviteInfo | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setState("loading");
    try {
      const data = await getInviteInfo(token);
      setInvite(data);
      setState("ready");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setState("error");
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setFieldError("Password is required.");
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Passwords do not match.");
      return;
    }
    setFieldError("");
    setIsSubmitting(true);
    try {
      await setInvitePassword(token, password);
      setState("done");
    } catch (error) {
      setFieldError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size="md" />
        </div>

        {state === "loading" && <LoadingState label="Loading invite..." />}

        {state === "error" && <ErrorState message={errorMessage} onRetry={load} />}

        {state === "done" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Password Set Successfully</h2>
            <p className="max-w-sm text-sm text-gray-500">You can now log in with your email and new password.</p>
            <Link href="/login">
              <Button className="mt-2">Go to Login</Button>
            </Link>
          </div>
        )}

        {state === "ready" && invite && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="mb-1 text-sm text-gray-500">
              Setting up access for <span className="font-medium text-gray-900">{invite.company_name}</span>
            </p>
            <p className="mb-6 text-xs text-gray-400">{invite.email}</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="New Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={fieldError}
                placeholder="••••••••"
              />
              <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
                Set Password
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
