import { getInstance, writeToMemory } from './wasm';

const WASM_INPUT_OFFSET = 4096;

/**
 * Estimate token count for a string.
 * Sub-millisecond. Zero allocations in WASM.
 */
export function slash(content: string): number {
  if (!content) return 0;
  const len = writeToMemory(content);
  const instance = getInstance();
  return (instance.exports.estimate_tokens as Function)(WASM_INPUT_OFFSET, len);
}

/**
 * Estimate token count from raw bytes.
 */
export function slashBytes(bytes: Uint8Array): number {
  if (!bytes.length) return 0;
  const instance = getInstance();
  const memory = instance.exports.memory as WebAssembly.Memory;
  const buffer = new Uint8Array(memory.buffer);
  const maxLen = Math.min(bytes.length, buffer.length - WASM_INPUT_OFFSET - 1);
  buffer.set(bytes.subarray(0, maxLen), WASM_INPUT_OFFSET);
  return (instance.exports.estimate_tokens as Function)(WASM_INPUT_OFFSET, maxLen);
}
