import React, { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAF952O_X3zyuNtUr";

function TurnstileWidget({ onVerify, onError, onExpire, theme = "auto" }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);

  onVerifyRef.current = onVerify;
  onErrorRef.current = onError;
  onExpireRef.current = onExpire;

  useEffect(() => {
    let interval = null;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current !== null) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: theme,
          size: "flexible",
          callback: (token) => {
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
          renderWidget();
        }
      }, 100);
    }

    return () => {
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
      ref={containerRef}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        minHeight: "65px",
        background: "transparent",
      }}
    />
  );
}

export default TurnstileWidget;
