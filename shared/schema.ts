import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agentSnapshots = sqliteTable("agent_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  summary: text("summary").notNull(),
  chartDataJson: text("chart_data_json"),
  fetchedAt: text("fetched_at").notNull(),
});

export const insertAgentSnapshotSchema = createInsertSchema(agentSnapshots).omit({ id: true });
export type InsertAgentSnapshot = z.infer<typeof insertAgentSnapshotSchema>;
export type AgentSnapshot = typeof agentSnapshots.$inferSelect;
