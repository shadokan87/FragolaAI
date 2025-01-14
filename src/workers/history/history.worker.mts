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
    newMessages: (MessageExtendedType | MessageType)[],
    replaceLast?: boolean
}) & {
    extensionFsPath: string,
    id: string
}

if (!parentPort) {
    throw new Error('This file must be run as a worker');
}

parentPort.on("message", async (message: HistoryWorkerPayload) => {
    const filePath = join(message.extensionFsPath, "src", "data", "chat", `${message.id}.json`);
    switch (message.kind) {
        case "CREATE": {
            try {
                const db = await JSONFilePreset<DbType>(
                    join(filePath),
                    message.initialMessages
                );
                await db.write();
                parentPort?.postMessage({
                    type: "SUCCESS"
                })
            } catch (e) {
                parentPort?.postMessage({
                    type: "ERROR"
                })
            }
            break;
        } case "UPDATE": {
            try {
                const db = await JSONFilePreset<DbType>(filePath, []);
                await db.update((data) => {
                    if (message.replaceLast) {
                        data.pop();
                    }
                    data.push(...message.newMessages);
                });
                parentPort?.postMessage({
                    type: "SUCCESS"
                })
            } catch (e) {
                console.error("__ERR_WORKER__", e);
                parentPort?.postMessage({
                    type: "ERROR"
                })
            }
            break;
        }
        default: {
            console.error(`Kind error for history worker`);
            return;
        }
    }
});