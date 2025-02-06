import { type Note, type InsertNote, type Connection } from "@shared/schema";
import { localStorage } from "./storage/local";

export interface IStorage {
  getNotes(): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  getConnections(): Promise<Connection[]>;
  createConnection(
    sourceId: number, 
    targetId: number, 
    label?: string, 
    isAiGenerated?: boolean,
    relation?: string
  ): Promise<Connection>;
}

export class Storage implements IStorage {
  private connections: Map<number, Connection>;
  private connectionId: number;

  constructor() {
    this.connections = new Map();
    this.connectionId = 1;
  }

  async getNotes(): Promise<Note[]> {
    return localStorage.getNotes();
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    return localStorage.createNote(insertNote.content);
  }

  async getConnections(): Promise<Connection[]> {
    return Array.from(this.connections.values());
  }

  async createConnection(
    sourceId: number, 
    targetId: number, 
    label?: string,
    isAiGenerated: boolean = false,
    relation?: string
  ): Promise<Connection> {
    const id = this.connectionId++;
    const connection: Connection = {
      id,
      sourceId,
      targetId,
      label: label || null,
      isAiGenerated,
      relation: relation || null,
    };
    this.connections.set(id, connection);
    return connection;
  }
}

export const storage = new Storage();