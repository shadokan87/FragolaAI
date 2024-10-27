declare global {
    interface Window {
      acquireVsCodeApi(): {
        postMessage(message: any): void;
        getState(): any;
        setState(state: any): void;
      };
    }
  }
// class vsCodeAcquireFail extends Error {
//     constructor(message: string) {
//         super(message);
//         this.name = "vsCodeAcquireFail";
//     }
// }

// export function safeAcquireVsCodeApi() {
//     console.log("!called");
//     const _function = (window as any).acquireVsCodeApi;
//     try {
//         const vscode: codeApi = _function();
//         return vscode;
//     } catch(e) {
//         throw new vsCodeAcquireFail(JSON.stringify(e));
//     }
// }

// export interface postMessagePayload {
//     command?: string,
//     text?: string,
// }

// export interface codeApi {
//     postMessage: (payload: postMessagePayload) => any,
//     setState: (newState: any) => any,
//     getState: () => any
// }