"use client";

import { useEffect } from "react";
import { useExamStore } from "../lib/stores/examStore";
import { AlertTriangle, Shield, Eye } from "lucide-react";

interface ExamModeWrapperProps {
  children: React.ReactNode;
  moduleId?: string;
}

export default function ExamModeWrapper({
  children,
  moduleId,
}: ExamModeWrapperProps) {
  const {
    isExamMode,
    tabSwitchCount,
    suspiciousActivities,
    recordSuspiciousActivity,
    setFullscreen,
  } = useExamStore();

  useEffect(() => {
    if (isExamMode) {
      // Disable right-click
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        recordSuspiciousActivity("Right-click attempted");
      };

      // Disable F12, Ctrl+Shift+I, etc.
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          (e.ctrlKey && e.shiftKey && e.key === "C") ||
          (e.ctrlKey && e.key === "u")
        ) {
          e.preventDefault();
          recordSuspiciousActivity(`Blocked key combination: ${e.key}`);
        }
      };

      // Monitor fullscreen changes
      const handleFullscreenChange = () => {
        const isFullscreen = !!document.fullscreenElement;
        setFullscreen(isFullscreen);
        if (!isFullscreen && isExamMode) {
          recordSuspiciousActivity("Exited fullscreen mode");
        }
      };

      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    }
  }, [isExamMode, recordSuspiciousActivity, setFullscreen]);

  if (isExamMode) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Exam Mode Header */}
        <div className="bg-red-600 p-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">SECURE EXAM MODE</span>
          </div>
          <div className="text-sm mt-1">
            Tab switches: {tabSwitchCount} | Monitoring active
          </div>
        </div>

        {/* Warning Banner */}
        {(tabSwitchCount > 0 || suspiciousActivities.length > 0) && (
          <div className="bg-yellow-600 p-3 text-center">
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Suspicious activity detected. Your teacher has been notified.
              </span>
            </div>
          </div>
        )}

        {/* Exam Content */}
        <div className="p-6">{children}</div>

        {/* Monitoring Indicator */}
        <div className="fixed bottom-4 right-4 bg-red-600 p-2 rounded-full">
          <Eye className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
