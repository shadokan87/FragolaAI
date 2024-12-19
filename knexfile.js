// Update with your config settings.
module.exports = {
  client: 'better-sqlite3',
  connection: {
    filename: './src/data/database.sqlite3'
  },
  migrations: {
    directory: './src/data/migrations'
  },
  useNullAsDefault: true
};