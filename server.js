/**
 * Joint-Track Rehab Sleeve — Simplified Server
 * ──────────────────────────────────────────────
 * Since we now use Blynk Cloud as the middleware between
 * Wokwi ESP32 and the React dashboard, this server only
 * needs to serve a basic health check endpoint.
 *
 * The React frontend (Vite dev server) proxies Blynk API
 * calls via vite.config.js — no backend needed in dev mode.
 *
 * This server can be used in production to serve the
 * built React static files + provide a health endpoint.
 *
 * Setup:
 *   npm install express
 *   node server.js
 */

import express from "express";

const app = express();
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() })
);

// ─── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[JointTrack] Server listening on port ${PORT}`);
  console.log(`[JointTrack] Health check: http://localhost:${PORT}/health`);
});