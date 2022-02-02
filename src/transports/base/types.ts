// Using this to make sure transports have an interface to extend from
// TODO:  Figure out how to do this without an empty interface?
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransportConfig {}

export interface UserConfig {
  id: string;
}

export interface LoopConfig {
  name: string;
}
