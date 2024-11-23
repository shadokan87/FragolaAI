import type OpenAI from "openai";
import knex from "knex";
import config from "../knexfile";
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

        constructor(private state: InstanceState = {
            discussionId: undefined
        }) {
            this.db = knex(config.development);
        }

        async createDiscussion(data: Insert<Tables['chat']>) {
            return await this.db("chat").insert(data).select();
        }
    }
}