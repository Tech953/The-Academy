/**
 * Compatibility entry point for older API-server imports.
 *
 * The runtime contract lives in @workspace/game-engine so server generation,
 * mobile cache parsing, and deterministic fallback generation cannot drift.
 */
export * from '@workspace/game-engine';
