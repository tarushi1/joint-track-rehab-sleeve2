/**
 * IoT → Supabase Backend
 * ----------------------
 * Receives data from IoT devices and syncs to Supabase.
 * Supports both HTTP POST ingestion and MQTT (via mqtt.js).
 *
 * Setup:
 *   npm install @supabase/supabase-js express dotenv mqtt
 *
 * .env:
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_SERVICE_KEY=your-service-role-key
 *   DEVICE_SECRET=your-shared-device-secret
 *   MQTT_BROKER=mqtt://broker.hivemq.com       (optional)
 *   MQTT_TOPIC=iot/devices/#                   (optional)
 *   PORT=3000
 */

import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import mqtt from "mqtt";

// ─── Supabase Client ────────────────────────────────────────────────────────

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // service role key — never expose to client
);

// ─── Express App ────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// ─── Auth Middleware ─────────────────────────────────────────────────────────
// Simple shared-secret auth for IoT devices.
// Swap this out for JWT or API key table lookup if needed.

function authDevice(req, res, next) {
    const secret = req.headers["x-device-secret"];
    if (!secret || secret !== process.env.DEVICE_SECRET) {
        return res.status(401).json({ error: "Unauthorized device" });
    }
    next();
}

// ─── Core: Ingest & Store ────────────────────────────────────────────────────

/**
 * Validates and normalises a raw payload from any source (HTTP or MQTT).
 * Extend the schema check here to match your sensor fields.
 */
function parsePayload(raw) {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    const { device_id, readings, timestamp } = data;

    if (!device_id) throw new Error("Missing device_id");
    if (!readings || typeof readings !== "object") throw new Error("Missing readings object");

    return {
        device_id: String(device_id),
        readings,                                          // e.g. { temp: 23.4, humidity: 60, voltage: 3.7 }
        recorded_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    };
}

/**
 * Writes one sensor record to Supabase.
 * Table: iot_readings (device_id TEXT, readings JSONB, recorded_at TIMESTAMPTZ)
 *
 * Run this SQL in Supabase to create the table:
 *
 *   create table iot_readings (
 *     id           bigserial primary key,
 *     device_id    text        not null,
 *     readings     jsonb       not null,
 *     recorded_at  timestamptz not null default now()
 *   );
 *
 *   -- Optional: index for fast per-device queries
 *   create index on iot_readings (device_id, recorded_at desc);
 *
 *   -- Optional: enable Realtime on this table in Supabase dashboard
 *   --           or run: alter publication supabase_realtime add table iot_readings;
 */
async function storeReading(payload) {
    const { error } = await supabase.from("iot_readings").insert(payload);
    if (error) throw error;
    console.log(`[DB] Stored reading from device ${payload.device_id}`);
}

// ─── HTTP Endpoints ──────────────────────────────────────────────────────────

// POST /ingest  — IoT device calls this directly
app.post("/ingest", authDevice, async (req, res) => {
    try {
        const payload = parsePayload(req.body);
        await storeReading(payload);
        res.json({ ok: true, recorded_at: payload.recorded_at });
    } catch (err) {
        console.error("[HTTP] Ingest error:", err.message);
        res.status(400).json({ error: err.message });
    }
});

// GET /devices/:id/latest  — fetch the most recent reading for a device
app.get("/devices/:id/latest", async (req, res) => {
    const { data, error } = await supabase
        .from("iot_readings")
        .select("*")
        .eq("device_id", req.params.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

    if (error) return res.status(404).json({ error: "No readings found" });
    res.json(data);
});

// GET /devices/:id/history?limit=100  — fetch recent history
app.get("/devices/:id/history", async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const { data, error } = await supabase
        .from("iot_readings")
        .select("*")
        .eq("device_id", req.params.id)
        .order("recorded_at", { ascending: false })
        .limit(limit);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /health
app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// ─── MQTT Bridge (optional) ──────────────────────────────────────────────────
// If your IoT device publishes over MQTT instead of (or in addition to) HTTP,
// this bridge subscribes and funnels everything into Supabase the same way.

function startMqttBridge() {
    const brokerUrl = process.env.MQTT_BROKER;
    const topic = process.env.MQTT_TOPIC || "iot/devices/#";

    if (!brokerUrl) {
        console.log("[MQTT] MQTT_BROKER not set — skipping MQTT bridge");
        return;
    }

    const client = mqtt.connect(brokerUrl, {
        clientId: `supabase-bridge-${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
    });

    client.on("connect", () => {
        console.log(`[MQTT] Connected to ${brokerUrl}, subscribing to ${topic}`);
        client.subscribe(topic);
    });

    client.on("message", async (receivedTopic, message) => {
        try {
            const payload = parsePayload(message.toString());
            await storeReading(payload);
        } catch (err) {
            console.error(`[MQTT] Failed to process message on ${receivedTopic}:`, err.message);
        }
    });

    client.on("error", (err) => console.error("[MQTT] Error:", err.message));
    client.on("reconnect", () => console.log("[MQTT] Reconnecting..."));
}

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[HTTP] Server listening on port ${PORT}`);
    startMqttBridge();
});