import type OpenAI from "openai";
import knex from "knex";
import { Tables } from "knex/types/tables";
import { v4 } from "uuid";
import { createUtils } from "../extension";
import moment from 'moment';
import { readdir } from "fs/promises";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import { chunckType, extensionState } from "@types";

export namespace FragolaClient {
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

    type utilsType = ReturnType<typeof createUtils>;

    async function getChatFiles(utils: utilsType, location: "chat" | "task" = "chat", pattern?: string): Promise<chatFile[]> {
        const globPattern = pattern || '*';
        const { glob } = await import('glob');
        const files = await glob(`${utils.join("src", "data", location).fsPath}/${globPattern}`);

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

    const chatFileJoin = (utils: utilsType, file: chatFile, location: "chat" | "task" = "chat") => {
        let join = `${file.id}:${file.createdAt}:${file.updatedAt}:${file.label}`;
        return utils.join("src", "data", location).fsPath
    }

    interface chatCallback {
        onStateChange?: (prevState: InstanceState['chat'], newState: InstanceState['chat']) => void
    }
    export class Chat {
        public static defaultState = {
            id: undefined,
            db: undefined,
            isTmp: true
        }
        constructor(private state: InstanceState['chat'] = Chat.defaultState, private callbacks?: chatCallback,
            public utils: ReturnType<typeof createUtils> = undefined as any) { // Casting undefined as any is ugly but I set utils in createInstance class. To avoid '?' everywhere

        }

        getState(noDb: boolean = true): extensionState["chat"] | InstanceState["chat"] {
            if (noDb) {
                const {db, ...rest} = this.state;
                return rest as extensionState['chat'];
            }
            return this.state;
        }

        async startNewChat() {
            const newState = {
                id: undefined,
                isTmp: true
            };
            await this.set(newState);
            // this.updateState(newState);
        }
        private updateState(newState: InstanceState['chat']) {
            if (this.callbacks && this.callbacks.onStateChange) {
                const prevState = this.state;
                this.state = newState;
                this.callbacks.onStateChange(prevState, newState);
            }
        }
        async set(state: InstanceState['chat']) {
            if (state.db) {
                this.updateState(state);
            }
            else {
                const dbFile = await getChatFiles(this.utils, "chat", `${state.id}*`);
                if (!dbFile.length)
                    throw new Error(`Chat file for id: ${state.id} does not exist.`);
                const db = await JSONFilePreset<{ messages: chunckType[] }>(chatFileJoin(this.utils, dbFile[0]), { messages: [] });
                state.db = db;
                this.updateState(state);
            }
        }

        async create(newMessages: chunckType[], label: string) {
            const id = v4();
            const dateStr = moment().format('YYYY-MM-DD');
            const db = await JSONFilePreset<{ messages: chunckType[] }>(
                this.utils.join("src", "data", "chat", `${id}:${dateStr}:${dateStr}:${label}.json`).fsPath,
                { messages: [] }
            );
            await db.update(({ messages }) => messages.push(...newMessages));
            const all = await getChatFiles(this.utils, "chat");
            console.log("!all", all);
            const newState = { id, db };
            await this.set(newState);
            this.updateState(newState);
            return id;
        }

        async addMessage(newMessage: chunckType) {
            if (!this.state.id)
                throw new Error("No dicussion selected");
            await this.state.db?.update((data) => {
                data.messages.push(newMessage)
            });
        }
    }

    export class createInstance {

        constructor(

            private utils: ReturnType<typeof createUtils>,
            // getDatabaseInstance: () => knex.Knex,
            public chat: Chat = new Chat(Chat.defaultState)
        ) {
            chat.utils = this.utils;
        }
    }
}