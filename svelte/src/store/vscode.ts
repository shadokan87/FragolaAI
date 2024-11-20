import type { basePayload, inTypeUnion, outTypeUnion } from "../../../src/workers/types";
import type { codeApi } from "../utils/vscode";
import { writableHook } from "./hooks";

export interface extensionState {
  value: string,
}

export const codeStore = writableHook<codeApi<extensionState> | undefined>({
  initialValue: undefined,
  onSet(codeApi) {
    if (codeApi) {
      // Notify backend we are online so we can start receiving initial values such as color theme;
      codeApi.postMessage({type: "online"});
    } else {
      //TODO: handle error here
    }
  }
});

export const colorTheme = writableHook<string>({
  initialValue: "",
  onSet(value) {
  }
})