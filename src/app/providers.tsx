"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/stores/userStore";
import { useModuleStore } from "@/lib/stores/moduleStore";
import { useProgressStore } from "@/lib/stores/progressStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const { user, setUser, setLoading: setUserLoading } = useUserStore();
  const { setModules, setLoading: setModuleLoading } = useModuleStore();
  const { setProgress, setLoading: setProgressLoading } = useProgressStore();

  useEffect(() => {
    // Check authentication status on app load
    const checkAuth = async () => {
      const token = localStorage.getItem("auth-token");
      if (token && !user) {
        setUserLoading(true);
        try {
          const response = await fetch("/api/auth/verify", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem("auth-token");
          }
        } catch (error) {
          console.error("Auth verification failed:", error);
          localStorage.removeItem("auth-token");
        } finally {
          setUserLoading(false);
        }
      }
    };

    checkAuth();
  }, [user, setUser, setUserLoading]);

  useEffect(() => {
    // Initialize modules on app load
    const fetchModules = async () => {
      setModuleLoading(true);
      try {
        const response = await fetch("/api/modules");
        const modules = await response.json();
        setModules(modules);
      } catch (error) {
        console.error("Failed to fetch modules:", error);
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModules();
  }, [setModules, setModuleLoading]);

  useEffect(() => {
    // Fetch user progress when user is available
    if (user) {
      const fetchProgress = async () => {
        setProgressLoading(true);
        try {
          const response = await fetch(`/api/progress?userId=${user.id}`);
          const progress = await response.json();
          setProgress(progress);
        } catch (error) {
          console.error("Failed to fetch progress:", error);
        } finally {
          setProgressLoading(false);
        }
      };

      fetchProgress();
    }
  }, [user, setProgress, setProgressLoading]);

  return <>{children}</>;
}
