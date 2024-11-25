import type { Knex } from "knex";
import * as path from 'path';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: path.join(__dirname, "src", "data", "dev.sql"),
    //   options: {
    //     nativeBinding: path.join(".", "node_modules", "sqlite3", "build", "Release", "node_sqlite3.node"),
    // },
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, "src", "data", "migrations"),
      extension: "ts"
    }
  }
};

module.exports = config;