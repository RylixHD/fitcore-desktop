import type { State } from "./domain";
declare global {
  interface Window {
    fitcore: {
      load: () => Promise<State>;
      action: (value: unknown) => Promise<State>;
      file: (operation: string) => Promise<string | null>;
    };
  }
}
declare module "pdf-parse/lib/pdf-parse.js";
