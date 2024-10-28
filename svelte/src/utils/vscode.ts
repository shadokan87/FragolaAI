declare global {
    interface Window {
      CODE_API: {
        postMessage(message: postMessagePayload): void;
        getState(): any;
        setState(state: any): void;
      };
    }
  }

export interface postMessagePayload {
    command?: string,
    text?: string,
}