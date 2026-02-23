declare module 'archiver' {
  import { Stream } from 'stream';

  function archiver(
    format: string,
    options?: any
  ): Archiver;

  interface Archiver extends Stream {
    pipe<T extends Stream>(destination: T, options?: any): T;
    directory(source: string, destination: string | boolean): Archiver;
    file(source: string, data: any): Archiver;
    finalize(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): Archiver;
    abort(): Archiver;
  }

  export = archiver;
}
