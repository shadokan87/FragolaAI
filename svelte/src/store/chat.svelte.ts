import OpenAI from "openai";
import { writableHook } from "./hooks";
import { createHighlighter } from "shiki";
import type { basePayload, inTypeUnion } from "../../../src/workers/types";
import { type chunckType, type extensionState } from "../../../common";

export const highlighterStore = writableHook<Map<string, string>>({
  initialValue: new Map<string, string>()
});

export const extensionStateStore = writableHook<extensionState | undefined>({
  initialValue: undefined,
  onUpdate(previousValue, newValue) {
    console.log("_UPDATE_STATE_", newValue);
    return newValue;
  },
})

// export function createExtensionState() {
//   let state: extensionState | undefined = $state(undefined);
//   return {
//     get value() {
//       return state;
//     },
//     update(newState: extensionState) {
//       console.log("called update", newState);
//       state = newState;
//     },
//     clear() {
//       state = undefined;
//     }
//   }
// }

const codeBlockHighlightState: Map<string, string> = $state(new Map<string, string>());
export const codeBlockHighlight = () => codeBlockHighlightState;