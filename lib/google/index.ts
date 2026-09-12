/**
 * Re-exporta todo el módulo de Google Workspace.
 *
 * Uso:
 *   import { ensureWorkspaceFolder, createDoc, createSheet, writeData }
 *     from "@/lib/google";
 */

export { ensureWorkspaceFolder, listFiles } from "./drive";
export { createDoc, appendText } from "./docs";
export { createSheet, writeData } from "./sheets";
