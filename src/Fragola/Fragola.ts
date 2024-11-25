import type OpenAI from "openai";
import knex from "knex";
import { Tables } from "knex/types/tables";
import { v4 } from "uuid";
import { createUtils } from "../extension";
import moment from 'moment';
import { readdir } from "fs/promises";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";

export namespace FragolaClient {
    export type chunckType = OpenAI.Chat.Completions.ChatCompletionChunk;
    export interface chat {
        id: string,
        messages: chunckType[]
    }

    interface chatFile {
        id: string
        createdAt: string,
        updatedAt: string,
        label: string,
    }

    export interface InstanceState {
        chat: {
            id: string | undefined,
            db?: Low<{
                messages: chunckType[];
            }>;
            isTmp?: boolean
        }
    }

    export class chat {
        constructor(state: InstanceState['chat'] = {
            id: undefined,
            db: undefined
        }) {

        }

        set(state: InstanceState['chat']) {

        }
    }

    export class createInstance {

        constructor(

            private utils: ReturnType<typeof createUtils>,
            // getDatabaseInstance: () => knex.Knex,
            private state: InstanceState = {
                chat: {
                    id: undefined,
                    db: undefined
                }
            },
        ) {
        }
        async setchat(state: InstanceState['chat']) {
            if (state.db)
                this.state.chat = state;
            else {
                const dbFile = await this.getChatFiles("chat", `${state.id}*`);
                if (!dbFile.length)
                    throw new Error(`Chat file for id: ${state.id} does not exist.`);
                const db = await JSONFilePreset<{ messages: chunckType[] }>(this.chatFileJoin(dbFile[0]), { messages: [] });
                state.db = db;
                this.state.chat = state;
            }
        }

        chatFileJoin = (file: chatFile, location: "chat" | "task" = "chat") => {
            let join = `${file.id}:${file.createdAt}:${file.updatedAt}:${file.label}`;
            return this.utils.join("src", "data", location).fsPath
        }

        async getChatFiles(location: "chat" | "task" = "chat", pattern?: string): Promise<chatFile[]> {
            const globPattern = pattern || '*';
            const { glob } = await import('glob');
            const files = await glob(`${this.utils.join("src", "data", location).fsPath}/${globPattern}`);

            if (!files.length)
                return [];

            return files.map(filePath => {
                const fileName = filePath.split('/').pop()!;
                const split = fileName.split(":");
                return {
                    id: split[0],
                    createdAt: split[1],
                    updatedAt: split[2],
                    label: split[3].split('.')[0]
                }
            });
        }

        async createChat(newMessages: chunckType[], label: string) {
            const id = v4();
            const dateStr = moment().format('YYYY-MM-DD');
            const db = await JSONFilePreset<{ messages: chunckType[] }>(
                this.utils.join("src", "data", "chat", `${id}:${dateStr}:${dateStr}:${label}.json`).fsPath,
                { messages: [] }
            );
            await db.update(({ messages }) => messages.push(...newMessages));
            const all = await this.getChatFiles("chat");
            console.log("!all", all);
            await this.setchat({ id, db });
            return id;
        }

        async addMessage() {
            if (!this.state.chat.id)
                throw new Error("No dicussion selected");
        }
    }
}