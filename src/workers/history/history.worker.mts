import { MessageExtendedType, MessageType } from "@types"
import { parentPort, workerData } from 'worker_threads';
import { join } from "path";
import { JSONFilePreset } from "lowdb/node";

export type DbType = (MessageExtendedType | MessageType)[];

export type HistoryWorkerPayload = ({
    kind: "CREATE",
    initialMessages: MessageExtendedType[],
} | {
    kind: "UPDATE",
    newMessages: (MessageExtendedType | MessageType)[]
}) & {
    workspaceRoot: string,
    id: string
}

if (!parentPort) {
    throw new Error('This file must be run as a worker');
}

parentPort.on("message", async (message: HistoryWorkerPayload) => {
    const filePath = join(message.workspaceRoot, "src", "data", "chat", `${message.id}.json`);
    switch (message.kind) {
        case "CREATE": {
            const db = await JSONFilePreset<DbType>(
                join(filePath),
                message.initialMessages
            );
            await db.write();
            break;
        } case "UPDATE": {
            const db = await JSONFilePreset<DbType>(filePath, []);
            await db.update((data) => {
                data.push(...message.newMessages);
            });
            break;
        }
        default: {
            console.error(`Kind error for history worker`);
            return;
        }
    }
});