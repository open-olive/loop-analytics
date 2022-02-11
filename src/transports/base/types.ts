/**
 * Base config interfaces that all Transports should use directly or extend
 */

export interface TransportConfig {
  debug?: boolean;
}

export interface UserConfig {
  id: string;
}

export interface LoopConfig {
  name: string;
}
