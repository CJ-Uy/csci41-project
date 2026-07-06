import "dotenv/config";
import { drizzle } from "drizzle-orm/node-sqlite";
import { DatabaseSync } from "node:sqlite";

const sqlite = new DatabaseSync(process.env.DB_FILE_NAME);
const db = drizzle({ client: sqlite });
