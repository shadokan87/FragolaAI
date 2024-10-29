export interface extensionState {
  value: string,
}

interface codeApi<extensionStateType> {
  postMessage(message: postMessagePayload): void;
  getState(): extensionStateType;
  setState(state: extensionStateType): void;
}

export interface postMessagePayload {
  command?: string,
  text?: string,
}