import { network, whisper } from '@oliveai/ldk';

// Using this to make sure transports have an interface to extend from
// TODO:  Figure out how to do this without an empty interface?
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TransportConfig {}

export interface UserConfig {
  id: string;
  emailDomain: string;
  organization: string;
  operatingSystem: string;
}

export interface LoopConfig {
  name: string;
}

export abstract class Transport<
  T extends TransportConfig = TransportConfig,
  U extends UserConfig = UserConfig,
  L extends LoopConfig = LoopConfig
> {
  currentWhisperName?: string;

  abstract baseUrl: string;

  constructor(readonly transportConfig: T, readonly userConfig: U, readonly loopConfig: L) {}

  static async send(request: network.HTTPRequest) {
    console.log(`request`, JSON.stringify(request, null, 2));
    const { statusCode } = await network.httpRequest(request);
    if (statusCode < 200 || statusCode >= 300) {
      console.error(`Request failed with status code ${statusCode}: ${request.url}`);
    }
  }

  abstract trackWhisperDisplayed(name: string, isUpdated: boolean): Promise<void>;

  abstract trackWhisperClosed(name: string): Promise<void>;

  abstract trackComponentClicked(type: whisper.WhisperComponentType): Promise<void>;

  abstract trackComponentCopied(type: whisper.WhisperComponentType): Promise<void>;

  abstract trackEvent(props: any): Promise<void>;
}
