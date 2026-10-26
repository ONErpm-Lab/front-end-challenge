export type FetchFn = typeof fetch;
export type Clock = () => number;
export type Sleep = (ms: number) => Promise<void>;
