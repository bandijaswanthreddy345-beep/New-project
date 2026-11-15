// UX deterrent only, not a security control. Real protection (auth checks, rate limits, server-side validation) must stay enforced on the backend regardless of this component.
import React, { useState, useEffect, useRef } from "react";

// Master toggle: default true, automatically disabled in development mode
const ENABLE_DEVTOOLS_GUARD = true;

export default function DevToolsGuard() {
  const [toastMessage, setToastMessage] = useState("");
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(false);
  const toastTimeoutRef = useRef(null);

  const showToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage("");
    }, 2800);
  };

  useEffect(() => {
    // Automatically disabled in local development mode or via master toggle
    if (!ENABLE_DEVTOOLS_GUARD || import.meta.env.DEV) {
      return;
    }

    // 1. Disable right-click context menu site-wide EXCEPT for text inputs, textareas, and contenteditable elements
    const handleContextMenu = (e) => {
      const target = e.target;
      if (!target) return;

      const tagName = target.tagName ? target.tagName.toUpperCase() : "";
      const isInput =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target.isContentEditable ||
        (target.getAttribute && target.getAttribute("contenteditable") === "true");

      if (!isInput) {
        e.preventDefault();
      }
    };

    // 2. Block common inspect shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U (and Mac Cmd equivalents)
    // Never block Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+F, Ctrl+R, or zoom (+/-) or standard tab/accessibility navigation
    const handleKeyDown = (e) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toUpperCase() : "";
      const keyCode = e.keyCode || e.which;

      // F12 check
      const isF12 = key === "F12" || keyCode === 123;

      // Ctrl/Cmd + Shift + I/J/C
      const isInspectTools =
        isCtrlOrMeta &&
        e.shiftKey &&
        (key === "I" || key === "J" || key === "C" || keyCode === 73 || keyCode === 74 || keyCode === 67);

      // Ctrl/Cmd + U (View Source)
      const isViewSource = isCtrlOrMeta && !e.shiftKey && (key === "U" || keyCode === 85);

      if (isF12 || isInspectTools || isViewSource) {
        e.preventDefault();
        e.stopPropagation();
        showToast("Inspecting is disabled on this site.");
      }
    };

    // 3. DevTools-open heuristic:
    // Best-effort, not reliable, note this in code: check window outer/inner width-height difference above a threshold
    // (e.g. > 160px). This heuristic can give false positives on unusual display scalings or multi-monitor setups,
    // so we keep it strictly reversible and non-destructive: it simply shows an overlay and clears automatically
    // when the heuristic normalizes.
    const checkDevTools = () => {
      try {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;

        // DevTools opened as a side panel or bottom panel
        if (widthThreshold || heightThreshold) {
          setIsDevToolsDetected(true);
        } else {
          setIsDevToolsDetected(false);
        }
      } catch {
        // Safe fallback in restrictive environments
      }
    };

    // Attach event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", checkDevTools);

    // Poll every 1 second to detect when DevTools is opened or closed
    const pollInterval = setInterval(checkDevTools, 1000);
    // Initial check
    checkDevTools();

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", checkDevTools);
      clearInterval(pollInterval);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // If guard is disabled, render nothing
  if (!ENABLE_DEVTOOLS_GUARD || import.meta.env.DEV) {
    return null;
  }

  return (
    <>
      {/* Toast / Snackbar notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#064e3b",
            color: "#ffffff",
            padding: "10px 20px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            fontSize: "14px",
            fontWeight: "500",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid #059669",
            pointerEvents: "none",
            animation: "devToolsFadeIn 0.2s ease-out forwards",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* DevTools Open Full-Screen Overlay (Reversible & Non-destructive) */}
      {isDevToolsDetected && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="devtools-guard-title"
          aria-describedby="devtools-guard-desc"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(3, 20, 16, 0.94)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 99998,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "460px",
              backgroundColor: "#062e24",
              border: "1px solid #0d5f49",
              borderRadius: "16px",
              padding: "32px 24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
                color: "#34d399",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h2
              id="devtools-guard-title"
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#f3f4f6",
                marginBottom: "10px",
              }}
            >
              Developer Tools Detected
            </h2>
            <p
              id="devtools-guard-desc"
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              Please close developer tools to continue using JNTU Circle.
            </p>
            <div
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                fontSize: "12px",
                color: "#a7f3d0",
              }}
            >
              This screen will dismiss automatically once tools are closed.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
