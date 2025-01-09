import type OpenAI from "openai";
import knex from "knex";
import { Tables } from "knex/types/tables";
import { v4 } from "uuid";
import { createUtils } from "./utils";
import moment from 'moment';
import { readdir } from "fs/promises";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import { chunkType, MessageType, extensionState, MessageExtendedType, HistoryIndex } from "@types";
import { BehaviorSubject } from 'rxjs';
import { updateExtensionState } from "@utils";

export namespace FragolaClient {
    export type utilsType = ReturnType<typeof createUtils>;

    export type chatFile = {
        id: string,
        createdAt: number,
        label: string
    }

    export type InstanceState = {
        chat: {
            id: string | undefined,
            db?: Low<{
                messages: MessageType[];
            }>;
            isTmp?: boolean
        }
    }

    export const createInstance = (utils: utilsType, chat: Chat) => {
        return {
            utils,
            chat
        }
    }
    // async create(newMessages: messageType[], label: string) {
    //     const id = v4();
    //     // const dateStr = moment().format('YYYY-MM-DD');
    //     const db = await JSONFilePreset<{ messages: messageType[] }>(
    //         this.utils.join("src", "data", "chat", `${id}.json`).fsPath,
    //         { messages: [] }
    //     );
    //     await db.update(({ messages }) => messages.push(...newMessages));
    //     const all = await getChatFiles(this.utils, "chat");
    //     console.log("!all", all);
    //     const newState = { id, db };
    //     await this.set(newState);
    //     return id;
    // }
    export type DbType = (MessageExtendedType | MessageType)[];
    export class Chat {
        constructor(private state$: BehaviorSubject<extensionState>,
            private utils: ReturnType<typeof createUtils>,
            private db: Map<HistoryIndex['id'], Low<DbType>> = new Map()) {
        }

        setMessages(newMessages: MessageType[]) {
            updateExtensionState(this.state$, (prev) => {
                return {
                    ...prev,
                    workspace: {
                        ...prev.workspace,
                        messages: newMessages
                    }
                }
            })
        }

        async create(initialMessages: MessageExtendedType[]) {
            const id = v4();
            const db = await JSONFilePreset<DbType>(
                this.utils.join("src", "data", "chat", `${id}.json`).fsPath, 
                initialMessages
            );
            await db.write();
            this.db.set(id, db);
            return id;
        }

        async addMessages(conversationId: HistoryIndex['id'], messages: (MessageExtendedType | MessageType)[]) {
            const filePath = this.utils.join("src", "data", "chat", `${conversationId}.json`).fsPath;
            let db = this.db.get(conversationId);
            
            if (!db) {
                db = await JSONFilePreset<DbType>(filePath, []);
                this.db.set(conversationId, db);
            }

            await db.update((data) => {
                data.push(...messages);
            });
            
            this.setMessages([...this.state$.getValue().workspace.messages, ...messages]);
        }
    }
}