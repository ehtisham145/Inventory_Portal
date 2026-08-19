"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { roleHomePath } from "@/lib/jwt";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <p className="text-5xl font-bold text-gray-300">403</p>
      <h1 className="text-lg font-semibold text-gray-900">Access Denied</h1>
      <p className="max-w-sm text-sm text-gray-500">
        You don&apos;t have permission to view this page. If you believe this is a mistake, contact your
        administrator.
      </p>
      <Link href={user ? roleHomePath(user.role) : "/login"}>
        <Button>Go to my dashboard</Button>
      </Link>
    </div>
  );
}
