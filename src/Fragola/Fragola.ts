import type OpenAI from "openai";
import knex from "knex";
import { Tables } from "knex/types/tables";

type Insert<T> = Partial<Omit<T, "id">>;

export namespace FragolaClient {
    export type chunckType = OpenAI.Chat.Completions.ChatCompletionChunk;
    export interface Discussion {
        id: string,
        messages: chunckType[]
    }

    export interface InstanceState {
        discussionId: string | undefined;
    }

    export class createInstance {
        private db: knex.Knex;

        constructor(
            getDatabaseInstance: () => knex.Knex,
            private state: InstanceState = {
                discussionId: undefined
            }
        ) {
            this.db = getDatabaseInstance();
            this.initDatabase();
        }

        private async initDatabase() {
            const hasTable = await this.db.schema.hasTable('chat');
            if (!hasTable) {
                await this.db.schema.createTable('chat', (table) => {
                    table.string('id').primary();
                    table.timestamp('created_at').defaultTo(this.db.fn.now());
                });
            }
        }

        async createDiscussion(data: Insert<Tables['chat']>) {
            return await this.db('chat')
                .insert(data)
                .returning('*');
        }
    }
}