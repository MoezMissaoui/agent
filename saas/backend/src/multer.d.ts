/** Minimal typings for `multer` when @types/multer is unavailable (e.g. Docker). */
declare module 'multer' {
  export interface StorageEngine {
    _handleFile(
      req: unknown,
      file: unknown,
      callback: (error?: unknown, info?: unknown) => void,
    ): void;
    _removeFile(req: unknown, file: unknown, callback: (error: Error) => void): void;
  }
  export function memoryStorage(): StorageEngine;
}
