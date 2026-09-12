/**
 * Re-exporta el orquestador y los agentes individuales.
 *
 * Uso principal:
 *   import { runPipeline } from "@/lib/agents";
 *
 * Para testing o extensión individual:
 *   import { researcher, strategist, creator, analyst } from "@/lib/agents";
 */

export { runPipeline } from "./director";
export { researcher } from "./researcher";
export { strategist } from "./strategist";
export { creator } from "./creator";
export { analyst } from "./analyst";
export type { PipelineContext, AgentResult, AgentFn } from "./types";
