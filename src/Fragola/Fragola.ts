import type OpenAI from "openai";
import knex from "knex";
import { Tables } from "knex/types/tables";
import { v4 } from "uuid";
import { createUtils } from "./utils";
import moment from 'moment';
import { readdir } from "fs/promises";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import { chunkType,MessageType, extensionState, MessageExtendedType } from "@types";
import { BehaviorSubject } from 'rxjs';

export namespace FragolaClient {
    interface chatFile {
        id: string
        createdAt: string,
        label: string,
    }

    export interface InstanceState {
        chat: {
            id: string | undefined,
            db?: Low<{
                messages: MessageType[];
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
                label: ""
            }
        });
    }

    const chatFileJoin = (utils: utilsType, file: chatFile, location: "chat" | "task" = "chat") => {
        let join = `${file.id}:${file.createdAt}:${file.label}`;
        return utils.join("src", "data", location).fsPath
    }

    export class Chat {
        constructor(history: extensionState['chatHistory']) {

        }
    }

    export class createInstance {
        constructor(
            private utils: ReturnType<typeof createUtils>,
            public chat: Chat = new Chat([])
        ) {
        }
    }
}