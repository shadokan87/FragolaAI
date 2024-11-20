export type basePayload<T> = {
    id?: string,
    type: T
}

export type inTypeUnion = "chunck" | "colorTheme" | "shikiHtml";
export type outTypeUnion = "chatRequest" | "online" | "syntaxHighlight";