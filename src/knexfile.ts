import type { Knex } from "knex";
import { join } from 'path';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: join(__dirname, "data", "dev.sql")
    },
    useNullAsDefault: true,
    migrations: {
      directory: join(__dirname, "data", "migrations"),
      extension: "ts"
    }
  }
};

export default config;