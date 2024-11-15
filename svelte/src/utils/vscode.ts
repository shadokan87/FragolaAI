import {type basePayload, type outTypeUnion} from "../../../src/workers/types";

export interface codeApi<extensionStateType> {
  postMessage<T extends basePayload<outTypeUnion>>(message: T): void;
  getState(): extensionStateType;
  setState(state: extensionStateType): void;
}