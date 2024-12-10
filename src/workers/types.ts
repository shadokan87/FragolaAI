export type basePayload<T> = {
    id?: string,
    type: T
}

export const END_SENTINEL = "__END__";
export type inTypeUnion = "chunk"
    | "colorTheme"
    | "shikiHtml"
    | typeof END_SENTINEL
    | "stateUpdate"
    | "appendMessage"
    | "history"
    ;
export type outTypeUnion = "chatRequest"
    | "online"
    | "syntaxHighlight"
    | "webviewReady"
    | "alert"
    | "history";