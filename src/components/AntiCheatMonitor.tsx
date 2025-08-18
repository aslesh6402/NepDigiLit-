"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

interface AntiCheatMonitorProps {
  examAttemptId: string;
  proctoringSettings: {
    proctoringEnabled: boolean;
    allowTabSwitch: boolean;
    maxTabSwitches: number;
    webcamRequired: boolean;
    fullScreenRequired: boolean;
  };
  onViolation?: (violation: any) => void;
  onTermination?: () => void;
}

interface ViolationEvent {
  type: string;
  timestamp: string;
  details?: any;
}

const AntiCheatMonitor: React.FC<AntiCheatMonitorProps> = ({
  examAttemptId,
  proctoringSettings,
  onViolation,
  onTermination,
}) => {
  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef(Date.now());

  const trackViolation = useCallback(
    async (eventType: string, details: any = {}) => {
      const violation: ViolationEvent = {
        type: eventType,
        timestamp: new Date().toISOString(),
        details,
      };

      setViolations((prev) => [...prev, violation]);

      // Send to server
      try {
        const response = await fetch(
          `/api/student/exams/attempts/${examAttemptId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventType,
              timestamp: violation.timestamp,
              details,
            }),
          }
        );

        const result = await response.json();

        if (result.terminated) {
          onTermination?.();
          return;
        }

        if (result.warning) {
          setWarnings((prev) => [...prev, result.warning]);
        }

        onViolation?.(violation);
      } catch (error) {
        console.error("Error tracking violation:", error);
      }
    },
    [examAttemptId, onViolation, onTermination]
  );

  // Tab/Window focus monitoring
  useEffect(() => {
    if (!proctoringSettings.proctoringEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          trackViolation("TAB_SWITCH", { count: newCount });

          if (
            !proctoringSettings.allowTabSwitch ||
            newCount > proctoringSettings.maxTabSwitches
          ) {
            setWarnings((prev) => [
              ...prev,
              `Tab switch detected! (${newCount}/${proctoringSettings.maxTabSwitches} allowed)`,
            ]);
          }

          return newCount;
        });
      }
    };

    const handleFocus = () => {
      lastActiveRef.current = Date.now();
    };

    const handleBlur = () => {
      trackViolation("WINDOW_FOCUS_LOSS", {
        timeAway: Date.now() - lastActiveRef.current,
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [proctoringSettings, trackViolation]);

  // Fullscreen monitoring
  useEffect(() => {
    if (!proctoringSettings.fullScreenRequired) return;

    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      setIsFullScreen(isCurrentlyFullScreen);

      if (!isCurrentlyFullScreen && proctoringSettings.fullScreenRequired) {
        trackViolation("FULLSCREEN_EXIT");
        setWarnings((prev) => [...prev, "Please return to fullscreen mode!"]);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, [proctoringSettings.fullScreenRequired, trackViolation]);

  // Mouse monitoring
  useEffect(() => {
    if (!proctoringSettings.proctoringEnabled) return;

    const handleMouseLeave = () => {
      trackViolation("MOUSE_LEFT_WINDOW");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      trackViolation("RIGHT_CLICK");
      setWarnings((prev) => [
        ...prev,
        "Right-click is disabled during the exam",
      ]);
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [proctoringSettings.proctoringEnabled, trackViolation]);

  // Keyboard monitoring
  useEffect(() => {
    if (!proctoringSettings.proctoringEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common cheating key combinations
      const blockedCombinations = [
        { ctrl: true, key: "c" }, // Copy
        { ctrl: true, key: "v" }, // Paste
        { ctrl: true, key: "x" }, // Cut
        { ctrl: true, key: "a" }, // Select all
        { ctrl: true, key: "f" }, // Find
        { ctrl: true, key: "h" }, // History
        { ctrl: true, key: "j" }, // Downloads
        { ctrl: true, key: "k" }, // Search
        { ctrl: true, key: "l" }, // Address bar
        { ctrl: true, key: "n" }, // New window
        { ctrl: true, key: "r" }, // Refresh
        { ctrl: true, key: "t" }, // New tab
        { ctrl: true, key: "w" }, // Close tab
        { alt: true, key: "Tab" }, // Alt+Tab
        { key: "F12" }, // Developer tools
        { ctrl: true, shift: true, key: "I" }, // Developer tools
        { ctrl: true, shift: true, key: "J" }, // Console
        { ctrl: true, shift: true, key: "C" }, // Element inspector
      ];

      const isBlocked = blockedCombinations.some((combo) => {
        const ctrlMatch = combo.ctrl ? e.ctrlKey : !e.ctrlKey;
        const shiftMatch = combo.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = combo.alt ? e.altKey : !e.altKey;
        const keyMatch = combo.key.toLowerCase() === e.key.toLowerCase();

        return ctrlMatch && shiftMatch && altMatch && keyMatch;
      });

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();

        if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) {
          trackViolation("COPY_PASTE", { key: e.key });
          setWarnings((prev) => [
            ...prev,
            "Copy/paste operations are not allowed",
          ]);
        } else if (e.key === "F12" || (e.ctrlKey && e.shiftKey)) {
          trackViolation("DEVELOPER_TOOLS");
          setWarnings((prev) => [...prev, "Developer tools access blocked"]);
        } else {
          trackViolation("SUSPICIOUS_KEYBOARD", {
            key: e.key,
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [proctoringSettings.proctoringEnabled, trackViolation]);

  // DevTools detection
  useEffect(() => {
    if (!proctoringSettings.proctoringEnabled) return;

    let devtools = {
      open: false,
      orientation: null as string | null,
    };

    const threshold = 160;

    const detectDevTools = () => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          trackViolation("DEVELOPER_TOOLS");
          setWarnings((prev) => [
            ...prev,
            "Developer tools detected and blocked",
          ]);
        }
      } else {
        devtools.open = false;
      }
    };

    intervalRef.current = setInterval(detectDevTools, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [proctoringSettings.proctoringEnabled, trackViolation]);

  // Auto-enter fullscreen if required
  useEffect(() => {
    if (proctoringSettings.fullScreenRequired && !isFullScreen) {
      const enterFullScreen = async () => {
        try {
          await document.documentElement.requestFullscreen();
        } catch (error) {
          console.error("Failed to enter fullscreen:", error);
          setWarnings((prev) => [
            ...prev,
            "Please enable fullscreen mode for this exam",
          ]);
        }
      };

      const timer = setTimeout(enterFullScreen, 1000);
      return () => clearTimeout(timer);
    }
  }, [proctoringSettings.fullScreenRequired, isFullScreen]);

  // Clear warnings after some time
  useEffect(() => {
    if (warnings.length > 0) {
      const timer = setTimeout(() => {
        setWarnings((prev) => prev.slice(1));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [warnings]);

  if (!proctoringSettings.proctoringEnabled) {
    return null;
  }

  return (
    <>
      {/* Warning overlay */}
      {warnings.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className="bg-red-500 text-white px-4 py-2 rounded shadow-lg animate-pulse"
            >
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-gray-800 text-white px-3 py-2 rounded text-xs">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                violations.length === 0
                  ? "bg-green-500"
                  : violations.length < 3
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            ></div>
            <span>
              Security:{" "}
              {violations.length === 0
                ? "Good"
                : violations.length < 3
                ? "Warning"
                : "High Risk"}
            </span>
          </div>
          {tabSwitchCount > 0 && (
            <div className="text-xs mt-1">
              Tab switches: {tabSwitchCount}/{proctoringSettings.maxTabSwitches}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen requirement overlay */}
      {proctoringSettings.fullScreenRequired && !isFullScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-xl font-bold mb-4">Fullscreen Required</h2>
            <p className="mb-4">
              This exam requires fullscreen mode for security purposes.
            </p>
            <button
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen();
                } catch (error) {
                  console.error("Failed to enter fullscreen:", error);
                }
              }}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AntiCheatMonitor;
