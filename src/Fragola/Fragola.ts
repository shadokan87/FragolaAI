import type OpenAI from "openai";
import knex from "knex";
import { Tables } from "knex/types/tables";
import { v4 } from "uuid";
import { createUtils } from "../extension";
import moment from 'moment';
import { readdir } from "fs/promises";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import { chunckType,messageType, extensionState } from "@types";
import { BehaviorSubject } from 'rxjs';

export namespace FragolaClient {
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
                messages: messageType[];
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
            return {
                id: filePath,
                createdAt: "",
                updatedAt: "",
                label: ""
            }
        });
        // return files.map(filePath => {
        //     const fileName = filePath.split('/').pop()!;
        //     const split = fileName.split(":");
        //     return {
        //         id: split[0],
        //         createdAt: split[1],
        //         updatedAt: split[2],
        //         label: split[3].split('.')[0]
        //     }
        // });
    }

    const chatFileJoin = (utils: utilsType, file: chatFile, location: "chat" | "task" = "chat") => {
        let join = `${file.id}:${file.createdAt}:${file.updatedAt}:${file.label}`;
        return utils.join("src", "data", location).fsPath
    }

    export class Chat {
        public static defaultState = {
            id: undefined,
            db: undefined,
            isTmp: true
        }
        private stateSubject: BehaviorSubject<InstanceState['chat']>;

        constructor(
            initialState: InstanceState['chat'] = Chat.defaultState,
            public utils: ReturnType<typeof createUtils> = undefined as any
        ) {
            this.stateSubject = new BehaviorSubject<InstanceState['chat']>(initialState);
        }

        get state$() {
            return this.stateSubject.asObservable();
        }

        private get currentState() {
            return this.stateSubject.getValue();
        }

        getState(noDb: boolean = true): extensionState["chat"] | InstanceState["chat"] {
            if (noDb) {
                const {db, ...rest} = this.currentState;
                return rest as extensionState['chat'];
            }
            return this.currentState;
        }

        async startNewChat() {
            const newState = {
                id: undefined,
                isTmp: true
            };
            await this.set(newState);
        }

        async set(state: InstanceState['chat']) {
            if (state.db) {
                this.stateSubject.next(state);
            }
            else {
                const dbFile = await getChatFiles(this.utils, "chat", `${state.id}*`);
                if (!dbFile.length)
                    throw new Error(`Chat file for id: ${state.id} does not exist.`);
                const db = await JSONFilePreset<{ messages: messageType[] }>(chatFileJoin(this.utils, dbFile[0]), { messages: [] });
                state.db = db;
                this.stateSubject.next(state);
            }
        }

        async create(newMessages: messageType[], label: string) {
            const id = v4();
            // const dateStr = moment().format('YYYY-MM-DD');
            const db = await JSONFilePreset<{ messages: messageType[] }>(
                this.utils.join("src", "data", "chat", `${id}.json`).fsPath,
                { messages: [] }
            );
            await db.update(({ messages }) => messages.push(...newMessages));
            const all = await getChatFiles(this.utils, "chat");
            console.log("!all", all);
            const newState = { id, db };
            await this.set(newState);
            return id;
        }

        async addMessage(newMessage: messageType, notify?: (newMessage: messageType) => Promise<void>) {
            if (!this.currentState.id)
                throw new Error("No discussion selected");
            await this.currentState.db?.update((data) => {
                data.messages.push(newMessage)
            });
            notify && await notify(newMessage);
        }
    }

    export class createInstance {
        constructor(
            private utils: ReturnType<typeof createUtils>,
            public chat: Chat = new Chat(Chat.defaultState)
        ) {
            chat.utils = this.utils;
        }
    }
}