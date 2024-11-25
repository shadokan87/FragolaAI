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
        private db: knex.Knex = 0 as any;

        constructor(
            getDatabaseInstance: () => knex.Knex,
            onError: (e: unknown) => void,
            private state: InstanceState = {
                discussionId: undefined
            }
        ) {
            try {
            this.db = getDatabaseInstance();
            } catch(e) {
                onError(e);
            }
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