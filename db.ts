import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();
const db = new Database(process.env.DB_FILE || "./poc.db");

// initalize db
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  phone TEXT UNIQUE,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  raw_text TEXT,
  parsed_json TEXT,
  calories REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

export function findOrCreateUserByPhone(phone: string) {
  const row = db.prepare("SELECT    * FROM users WHERE phone = ?").get(phone);
  if (row) return row;
  const info = db.prepare("INSERT INTO users (phone) VALUES (?)").run(phone);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
}

export function addMeal(user_id: number, raw_text: string, parsed_json: object, calories?: number) {
  const stmt = db.prepare("INSERT INTO meals (user_id, raw_text, parsed_json, calories) VALUES (?,?,?,?)");
  const info = stmt.run(user_id, raw_text, JSON.stringify(parsed_json || {}), calories || null);
  return db.prepare("SELECT * FROM meals WHERE id = ?").get(info.lastInsertRowid);
}

export function getUserMeals(user_id: number, limit = 10) {
  return db.prepare("SELECT * FROM meals WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(user_id, limit);
}
