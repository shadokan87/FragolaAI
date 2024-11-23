import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('chat', (table) => {
        table.uuid('id').primary();
        table.string('label');
        table.jsonb('messages').defaultTo('[]');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('chat');
}