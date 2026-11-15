import React, { useEffect, useRef, useState } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAF952O_X3zyuNtUr";

function TurnstileWidget({ onVerify, onError, onExpire, theme = "auto" }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  const [isRendered, setIsRendered] = useState(false);

  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  useEffect(() => {
    let interval = null;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current !== null) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: theme,
          size: "normal",
          execution: "render",
          appearance: "always",
          callback: (token) => {
            setIsRendered(true);
            if (onVerifyRef.current) onVerifyRef.current(token);
          },
          "error-callback": (err) => {
            console.error("Cloudflare Turnstile error:", err);
            if (onErrorRef.current) onErrorRef.current(err);
          },
          "expired-callback": () => {
            if (onExpireRef.current) onExpireRef.current();
          },
        });
        setIsRendered(true);
      } catch (e) {
        console.error("Turnstile render error:", e);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          interval = null;
          renderWidget();
        }
      }, 50);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          // ignore
        }
      }
    };
  }, [theme]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        minHeight: "65px",
        background: "transparent",
      }}
    >
      {!isRendered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            color: "#6b7280",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              border: "2px solid #087943",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "turnstileSpin 0.75s linear infinite",
            }}
          />
          <span>Connecting security verification...</span>
          <style>{`
            @keyframes turnstileSpin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          minHeight: "65px",
        }}
      />
    </div>
  );
}

export default TurnstileWidget;
