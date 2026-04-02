import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get latest snapshots for all agents
  app.get("/api/snapshots", async (_req, res) => {
    try {
      const snapshots = storage.getLatestSnapshots();
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch snapshots" });
    }
  });

  // Get history for a specific agent
  app.get("/api/snapshots/:agentId", async (req, res) => {
    try {
      const snapshots = storage.getSnapshotsByAgent(req.params.agentId);
      res.json(snapshots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent history" });
    }
  });

  // Seed / refresh data endpoint
  app.post("/api/seed", async (req, res) => {
    try {
      const { agents } = req.body;
      if (!Array.isArray(agents)) {
        return res.status(400).json({ error: "agents array required" });
      }
      const results = [];
      for (const agent of agents) {
        const snap = storage.insertSnapshot({
          agentId: agent.agentId,
          agentName: agent.agentName,
          summary: agent.summary,
          chartDataJson: agent.chartDataJson || null,
          fetchedAt: agent.fetchedAt || new Date().toISOString(),
        });
        results.push(snap);
      }
      res.json({ inserted: results.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to seed data" });
    }
  });

  return httpServer;
}
