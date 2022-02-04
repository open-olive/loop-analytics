/**
 * Base config interfaces that all Transports should use directly or extend
 */

// ? How do we do this without an empty interface? Needed for inheritance but no Transports share any properties
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransportConfig {}

export interface UserConfig {
  id: string;
}

export interface LoopConfig {
  name: string;
}
