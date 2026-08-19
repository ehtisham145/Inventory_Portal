"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { roleHomePath } from "@/lib/jwt";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? roleHomePath(user.role) : "/login");
  }, [isLoading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoadingState />
    </div>
  );
}
