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
import { createUpdateState } from "@utils";
import { FragolaVscode } from "./vscode";

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
            private updateExtensionState: (callback: Parameters<ReturnType<typeof createUpdateState<extensionState>>>[1]) => void
        ) {
        }

        setMessages(newMessages: MessageType[]) {
            this.updateExtensionState((prev) => {
                return {
                    ...prev,
                    workspace: {
                        ...prev.workspace,
                        messages: newMessages
                    }
                }
            })
        }

        addMessages(conversationId: HistoryIndex['id'], messages: (MessageExtendedType | MessageType)[]) {
            this.setMessages([...this.state$.getValue().workspace.messages, ...messages]);
        }

        async create(initialMessages: MessageExtendedType[]) {
            const id = v4();
            this.updateExtensionState((prev) => {
                const historyIndex: HistoryIndex[] = [...prev.workspace.historyIndex, {
                    id, meta: {
                        label: undefined, createdAt: moment().format('YYYY-MM-DD')
                    }
                }];
                return {
                    ...prev,
                    workspace: {
                        ...prev.workspace,
                        ui: {
                            ...prev.workspace.ui,
                            conversationId: id
                        },
                        historyIndex,
                        messages: initialMessages
                    }
                }
            })
        }
    }
}