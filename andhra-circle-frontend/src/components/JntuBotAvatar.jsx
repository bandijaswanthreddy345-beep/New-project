import "./JntuBotAvatar.css";

/**
 * JNTU Circle AI assistant mark:
 * Features the official JNTU logo framed in a signature golden circular badge.
 *
 * Props:
 *  - size: pixel size (square), default 32
 *  - state: "default" | "working" (working pulses an ambient golden halo)
 *  - className: optional additional classes
 */
function JntuBotAvatar({ size = 32, state = "default", className = "" }) {
  const isWorking = state === "working";

  return (
    <div
      className={`jb-avatar-wrap ${isWorking ? "is-working" : ""} ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
      }}
      role="img"
      aria-label="JNTU Circle Assistant"
    >
      <img
        src="/jntu-circle-logo.png"
        alt="JNTU Logo"
        className="jb-avatar-img"
        loading="eager"
        draggable={false}
      />
    </div>
  );
}

export default JntuBotAvatar;
