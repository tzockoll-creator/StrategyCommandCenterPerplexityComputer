import { agentSnapshots, type AgentSnapshot, type InsertAgentSnapshot } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getLatestSnapshots(): AgentSnapshot[];
  getSnapshotsByAgent(agentId: string): AgentSnapshot[];
  insertSnapshot(snapshot: InsertAgentSnapshot): AgentSnapshot;
}

export class DatabaseStorage implements IStorage {
  getLatestSnapshots(): AgentSnapshot[] {
    // Get the latest snapshot for each agent
    const allSnapshots = db
      .select()
      .from(agentSnapshots)
      .orderBy(desc(agentSnapshots.fetchedAt))
      .all();

    const latestByAgent = new Map<string, AgentSnapshot>();
    for (const snap of allSnapshots) {
      if (!latestByAgent.has(snap.agentId)) {
        latestByAgent.set(snap.agentId, snap);
      }
    }
    return Array.from(latestByAgent.values());
  }

  getSnapshotsByAgent(agentId: string): AgentSnapshot[] {
    return db
      .select()
      .from(agentSnapshots)
      .where(eq(agentSnapshots.agentId, agentId))
      .orderBy(desc(agentSnapshots.fetchedAt))
      .all();
  }

  insertSnapshot(snapshot: InsertAgentSnapshot): AgentSnapshot {
    return db.insert(agentSnapshots).values(snapshot).returning().get();
  }
}

export const storage = new DatabaseStorage();
