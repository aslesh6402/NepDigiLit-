import { useState, useEffect, useCallback } from "react";
import { Module, ModuleFormData } from "../types/dashboard";

export const useModules = (teacherView: boolean = false) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParam = teacherView ? "?teacherView=true" : "";
      const response = await fetch(`/api/modules${queryParam}`);

      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }

      const data = await response.json();
      setModules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching modules:", err);
    } finally {
      setLoading(false);
    }
  }, [teacherView]);

  const createModule = async (moduleData: ModuleFormData) => {
    try {
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create module");
      }

      const newModule = await response.json();
      await fetchModules(); // Refresh the list
      return newModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
      throw err;
    }
  };

  const updateModule = async (moduleData: ModuleFormData) => {
    try {
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/modules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update module");
      }

      const updatedModule = await response.json();
      await fetchModules(); // Refresh the list
      return updatedModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update module");
      throw err;
    }
  };

  const deleteModule = async (moduleId: string) => {
    try {
      const token = localStorage.getItem("auth-token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/modules?id=${moduleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete module");
      }

      await fetchModules(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete module");
      throw err;
    }
  };

  const saveModule = async (moduleData: ModuleFormData) => {
    if (moduleData.id) {
      return updateModule(moduleData);
    } else {
      return createModule(moduleData);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [teacherView]);

  return {
    modules,
    loading,
    error,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    saveModule,
  };
};
