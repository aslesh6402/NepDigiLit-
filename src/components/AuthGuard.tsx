"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/userStore";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "STUDENT" | "TEACHER" | "ADMIN";
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requiredRole,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { user, isLoading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // If no user is authenticated, redirect to login
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // If a specific role is required and user doesn't have it, redirect
    if (requiredRole && user.role !== requiredRole) {
      // Redirect based on user's actual role
      if (user.role === "STUDENT") {
        router.push("/modules");
      } else if (user.role === "TEACHER") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
      return;
    }
  }, [user, isLoading, requiredRole, redirectTo, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have required role
  if (requiredRole && (!user || user.role !== requiredRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            {requiredRole === "TEACHER" ? "Teacher" : "Student"} access required
          </p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Please Login
          </h1>
          <p className="text-gray-600">You need to login to access this page</p>
        </div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}
