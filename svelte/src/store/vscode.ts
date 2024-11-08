import type { codeApi } from "../utils/vscode";
import { writableHook } from "./hooks";

export interface extensionState {
  value: string,
}

export const codeStore = writableHook<codeApi<extensionState> | undefined>({
    initialValue: undefined
});