export type basePayload<T> = {
    id?: string,
    type: T
}


export const END_SENTINEL = "__END__";
export type inTypeUnion = "chunck" | "colorTheme" | "shikiHtml" | typeof END_SENTINEL;
export type outTypeUnion = "chatRequest" | "online" | "syntaxHighlight";