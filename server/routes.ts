import type { Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";
import { storage } from "./storage";
import { insertNoteSchema, insertConnectionSchema } from "@shared/schema";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

interface RelationResponse {
  relation: string;
}

async function detectNoteRelation(note1Content: string, note2Content: string) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/detect-relation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text1: note1Content,
        text2: note2Content
      }),
    });

    if (!response.ok) {
      console.error('AI service error:', await response.text());
      return null;
    }

    const data = await response.json() as RelationResponse;
    return data.relation;
  } catch (error) {
    console.error('Error detecting relation:', error);
    return null;
  }
}

export function registerRoutes(app: Express): Server {
  app.get("/api/notes", async (_req, res) => {
    const notes = await storage.getNotes();
    res.json(notes);
  });

  app.post("/api/notes", async (req, res) => {
    const parsed = insertNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid note data" });
    }
    const note = await storage.createNote(parsed.data);

    // After creating a note, try to find relations with existing notes
    try {
      const existingNotes = await storage.getNotes();
      const relationPromises = existingNotes
        .filter(existingNote => existingNote.id !== note.id)
        .map(async (existingNote) => {
          const relation = await detectNoteRelation(note.content, existingNote.content);
          if (relation && ['continuation', 'prerequisite', 'example', 'analogy', 'shared_context'].includes(relation)) {
            return storage.createConnection(
              note.id,
              existingNote.id,
              `AI detected: ${relation}`,
              true,
              relation
            );
          }
          return null;
        });

      await Promise.all(relationPromises);
    } catch (error) {
      console.error('Error detecting relations:', error);
    }

    res.json(note);
  });

  app.post("/api/reprocess-connections", async (_req, res) => {
    try {
      const notes = await storage.getNotes();
      const processedConnections = [];

      // Process each pair of notes
      for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
          const relation = await detectNoteRelation(notes[i].content, notes[j].content);

          if (relation && ['continuation', 'prerequisite', 'example', 'analogy', 'shared_context'].includes(relation)) {
            const connection = await storage.createConnection(
              notes[i].id,
              notes[j].id,
              `AI detected: ${relation}`,
              true,
              relation
            );
            processedConnections.push(connection);
          }
        }
      }

      res.json({ message: `Created ${processedConnections.length} new connections` });
    } catch (error) {
      console.error('Error reprocessing connections:', error);
      res.status(500).json({ message: 'Failed to reprocess connections' });
    }
  });

  app.get("/api/connections", async (_req, res) => {
    const connections = await storage.getConnections();
    res.json(connections);
  });

  app.post("/api/connections", async (req, res) => {
    const parsed = insertConnectionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid connection data" });
    }
    const connection = await storage.createConnection(
      parsed.data.sourceId,
      parsed.data.targetId,
      parsed.data.label,
      false
    );
    res.json(connection);
  });

  return createServer(app);
}