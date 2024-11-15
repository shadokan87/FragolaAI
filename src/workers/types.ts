export type basePayload<T> = {
    id: string,
    type: T
}

export type inTypeUnion = "chunck";
export type outTypeUnion = "chatRequest"