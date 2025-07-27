declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    sessionId?: number | (() => string);
    transports?: string | string[];
  }

  class SockJS {
    constructor(url: string, _reserved?: any, options?: SockJSOptions);
    
    close(code?: number, reason?: string): void;
    send(data: string): void;
    
    onopen: ((e: Event) => void) | null;
    onmessage: ((e: MessageEvent) => void) | null;
    onclose: ((e: CloseEvent) => void) | null;
    onerror: ((e: Event) => void) | null;
    
    readyState: number;
    protocol: string;
    url: string;
    
    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;
  }

  export = SockJS;
}