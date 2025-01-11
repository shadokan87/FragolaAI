import { extensionState, InteractionMode } from "@types";

export function stateChangeMiddleware([prevState, newState]: [extensionState, extensionState]) {
    newState.workspace.ui.interactionMode = InteractionMode.BUILD;
    // const prevState = states[0];
    // const newState = states[1];
    // console.log("__PREV__", prevState);
    // console
}