/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('chats', function(table) {
        table.increments('id');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.string("test").notNullable();
        // table.json('messages').notNullable(); // Array of message strings stored as JSON
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('chats');
};