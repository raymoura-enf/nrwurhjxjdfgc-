import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => notes.id).notNull(),
  targetId: integer("target_id").references(() => notes.id).notNull(),
  label: text("label"),
  isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
  relation: text("relation"),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  content: true,
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  sourceId: true,
  targetId: true,
  label: true,
}).extend({
  label: z.string().optional(),
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type Connection = typeof connections.$inferSelect;