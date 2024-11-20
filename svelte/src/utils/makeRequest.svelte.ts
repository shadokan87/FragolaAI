import type { basePayload, inTypeUnion, outTypeUnion } from "../../../src/workers/types";
import { codeStore } from "../store/vscode";

const REQUEST_TIMEOUT = 1000;

let specificRequests: basePayload<inTypeUnion>[] = $state.raw([]);
export class RequestManager {
    getRequests() {
        return specificRequests;
    }
    addRequest(request: basePayload<inTypeUnion>) {
        console.log("#br3")
        specificRequests = [...specificRequests, request];
        console.log(specificRequests);
    }

    removeRequestById(id: basePayload<any>['id']) {
        specificRequests = specificRequests.filter(req => req.id == id);
    }

    async makeRequest<responseType>(postMessage: () => basePayload<outTypeUnion>): Promise<basePayload<inTypeUnion> & {data: responseType}> {
        const payload = postMessage();
        return payload as any;
    }
}