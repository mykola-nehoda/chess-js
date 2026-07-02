
// ─── Server Configuration ───────────────────────────────────────
// Edit SERVER_URL to point to your VPS before deploying.
//
// Examples:
//   ws://123.45.67.89:8765         (plain, direct IP)
//   ws://yourdomain.com:8765       (plain, domain)
//   wss://yourdomain.com/ws        (secure, via nginx reverse-proxy)
//
// For local testing use: ws://localhost:8765

const GameConfig = {
	SERVER_URL: "ws://localhost:8765",
};
