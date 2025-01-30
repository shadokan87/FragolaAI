import { v4 } from "uuid";
import { createUtils } from "./utils";
import moment from 'moment';
import { MessageType, ExtensionState, MessageExtendedType, HistoryIndex } from "@types";
import { BehaviorSubject } from 'rxjs';

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

        addMessages(messages: (MessageExtendedType | MessageType)[], replaceLast: boolean = false) {
            this.setMessages((prev) => {
                if (replaceLast)
                    return [...prev.workspace.messages.slice(0, -1), ...messages];
                return [...prev.workspace.messages, ...messages]
            });
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
                        messages: initialMessages,
                    }
                }
            })
            return id
        }
    }
}