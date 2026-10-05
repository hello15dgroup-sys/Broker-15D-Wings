/// <reference types="vite/client" />

declare interface DurableObjectState {
  storage: any;
  waitUntil(promise: Promise<any>): void;
  id: any;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}

declare interface DurableObjectNamespace {
  idFromName(name: string): any;
  idFromString(id: string): any;
  newUniqueId(): any;
  get(id: any): any;
}
