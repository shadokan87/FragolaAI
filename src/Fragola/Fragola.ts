import { v4 } from "uuid";
import { createUtils } from "./utils";
import moment from 'moment';
import { MessageType, ExtensionState, MessageExtendedType, HistoryIndex, payloadTypes, NONE_SENTINEL } from "@types";
import { BehaviorSubject } from 'rxjs';
import { TokenJS } from "@shadokan87/token.js";
import { existsSync, unlink } from "fs";

export namespace FragolaClient {
    export type utilsType = ReturnType<typeof createUtils>;

    export type chatFile = {
        id: string,
        createdAt: number,
        label: string
    }

    export const createInstance = (utils: utilsType, chat: Chat) => {
        return {
            utils,
            chat
        }
    }
    export type DbType = (MessageExtendedType | MessageType)[];
    export class Chat {
        constructor(private state$: BehaviorSubject<ExtensionState>,
            private utils: ReturnType<typeof createUtils>
        ) {
        }

        updateExtensionState(callback: (prev: ExtensionState) => ExtensionState) {
            this.state$.next(callback(this.state$.getValue()));
        }

        setMessages(callback: (prev: ExtensionState) => MessageType[]) {
            this.updateExtensionState(prev => {
                return {
                    ...prev,
                    workspace: {
                        ...prev.workspace,
                        messages: callback(prev),
                    }
                }
            })
        }

        addMessages(messages: MessageExtendedType[], replaceLast: boolean = false) {
            this.setMessages((prev) => {
                if (replaceLast)
                    return [...prev.workspace.messages.slice(0, -1), ...messages];
                return [...prev.workspace.messages, ...messages]
            });
        }

        async deleteConversation({conversationId}: payloadTypes.action.deleteConversation["parameters"]) {
            const filePath = this.utils.join("src", "data", "chat", `${conversationId}.json`).fsPath;
            if (existsSync(filePath))
                unlink(filePath, (err) => {
                    //TODO: handle error
                    console.error(err);
                });
            this.updateExtensionState(prev => {
                return {
                    ...prev,
                    workspace: {
                        ...prev.workspace,
                        historyIndex: prev.workspace.historyIndex.filter(history => history.id != conversationId),
                        messages: conversationId == prev.workspace.ui.conversationId && [] || prev.workspace.messages,
                        ui: {
                            ...prev.workspace.ui,
                            conversationId: conversationId == prev.workspace.ui.conversationId && NONE_SENTINEL || prev.workspace.ui.conversationId,
                        }
                    }
                }
            })
        }

        async create(initialMessages: MessageExtendedType[]) {
            const id = v4();
            const tokenjs = new TokenJS().extendModelList("bedrock", 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', "anthropic.claude-3-sonnet-20240229-v1:0")
                .extendModelList("bedrock", "us.anthropic.claude-3-5-haiku-20241022-v1:0", "anthropic.claude-3-5-haiku-20241022-v1:0");
            const label = await tokenjs.chat.completions.create({
                provider: 'bedrock',
                model: 'us.anthropic.claude-3-5-haiku-20241022-v1:0' as any,
                // Define your message
                messages: [
                    {
                        role: "system",
                        content: "Act as a label generator for a chatbot chat history. Your task is to create a simple and concise label based on the user's prompt. Respond only with the label.\n\nExample:\nInput: 'How do I implement a binary search algorithm in Python?'\nOutput: 'Python Binary Search Implementation'\n\nNow, generate a label for the given prompt."
                    },
                    {
                        role: 'user',
                        content: `${initialMessages[0].content}`,
                    },
                ],
            })
            this.updateExtensionState((prev) => {
                const historyIndex: HistoryIndex[] = [...prev.workspace.historyIndex, {
                    id, meta: {
                        label: label.choices[0].message.content?.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '') || `Untitled conversation - ${id}`, createdAt: moment().format('YYYY-MM-DD')
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
                        messages: initialMessages,
                    }
                }
            })
            return id
        }
    }
}