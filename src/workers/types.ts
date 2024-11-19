export type basePayload<T> = {
    id: string,
    type: T
}

export type inTypeUnion = "chunck" | "colorTheme";
export type outTypeUnion = "chatRequest" | "online";