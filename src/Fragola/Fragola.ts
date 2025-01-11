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
    export type DbType = (MessageExtendedType | MessageType)[];
    export class Chat {
        constructor(private state$: BehaviorSubject<extensionState>,
            private utils: ReturnType<typeof createUtils>
        ) {
        }

        updateExtensionState(callback: (prev: extensionState) => extensionState) {
            this.state$.next(callback(this.state$.getValue()));
        }

        setMessages(newMessages: MessageType[]) {
            this.updateExtensionState(prev => {
                return {
                    ...prev,
                    workspace: {
                        ...prev.workspace,
                        messages: newMessages
                    }
                }
            })
        }

        addMessages(messages: (MessageExtendedType | MessageType)[]) {
            this.setMessages([...this.state$.getValue().workspace.messages, ...messages]);
        }

        create(initialMessages: MessageExtendedType[]) {
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
            return id
        }
    }
}