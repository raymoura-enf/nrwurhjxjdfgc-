import Database from 'better-sqlite3';
import matter from 'gray-matter';
import fs from 'fs-extra';
import path from 'path';
import { type Note, type Connection } from '@shared/schema';

const NOTES_DIR = path.join(process.cwd(), 'data', 'notes');
const DB_PATH = path.join(process.cwd(), 'data', 'metadata.db');

interface NoteMetadata {
  id: number;
  title: string;
  file_path: string;
  created_at: string;
}

export class LocalStorage {
  private db: Database.Database;

  constructor() {
    // Ensure directories exist
    fs.ensureDirSync(NOTES_DIR);
    fs.ensureDirSync(path.dirname(DB_PATH));

    this.db = new Database(DB_PATH);
    this.initDatabase();
  }

  private initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes_metadata (
        id INTEGER PRIMARY KEY,
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_path TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        label TEXT,
        is_ai_generated BOOLEAN DEFAULT FALSE,
        relation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES notes_metadata(id),
        FOREIGN KEY (target_id) REFERENCES notes_metadata(id)
      );
    `);
  }

  async createNote(content: string): Promise<Note> {
    const id = Date.now();
    const fileName = `${id}.md`;
    const filePath = path.join(NOTES_DIR, fileName);

    // Parse content for title (first line)
    const title = content.split('\n')[0].replace(/^#\s*/, '').trim();

    // Create markdown file with frontmatter
    const fileContent = matter.stringify(content, {
      id,
      title,
      createdAt: new Date().toISOString(),
    });

    await fs.writeFile(filePath, fileContent);

    // Store metadata in SQLite
    const stmt = this.db.prepare<[number, string, string]>(
      'INSERT INTO notes_metadata (id, title, file_path) VALUES (?, ?, ?)'
    );
    stmt.run(id, title, filePath);

    return {
      id,
      content,
      createdAt: new Date(),
    };
  }

  async getNote(id: number): Promise<Note | undefined> {
    const stmt = this.db.prepare('SELECT file_path FROM notes_metadata WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return undefined;

    const fileContent = await fs.readFile(row.file_path, 'utf-8');
    const { content, data } = matter(fileContent);

    return {
      id: data.id,
      content,
      createdAt: new Date(data.createdAt),
    };
  }

  async getNotes(): Promise<Note[]> {
    const stmt = this.db.prepare('SELECT * FROM notes_metadata ORDER BY created_at DESC');
    const rows = stmt.all() as NoteMetadata[];

    const notes = await Promise.all(
      rows.map(async (row) => {
        const fileContent = await fs.readFile(row.file_path, 'utf-8');
        const { content, data } = matter(fileContent);
        return {
          id: data.id as number,
          content,
          createdAt: new Date(data.createdAt as string),
        };
      })
    );

    return notes;
  }

  async createConnection(
    sourceId: number,
    targetId: number,
    label?: string,
    isAiGenerated: boolean = false,
    relation?: string
  ): Promise<Connection> {
    const stmt = this.db.prepare(`
      INSERT INTO connections (source_id, target_id, label, is_ai_generated, relation)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `);

    const result = stmt.get(sourceId, targetId, label || null, isAiGenerated, relation || null) as Connection;

    return {
      id: result.id,
      sourceId,
      targetId,
      label: label || null,
      isAiGenerated,
      relation: relation || null,
    };
  }

  async getConnections(): Promise<Connection[]> {
    const stmt = this.db.prepare('SELECT * FROM connections ORDER BY created_at DESC');
    return stmt.all() as Connection[];
  }
}

export const localStorage = new LocalStorage();