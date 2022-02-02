import { network, whisper } from '@oliveai/ldk';

import { LoopConfig, TransportConfig, UserConfig } from './types';

export * from './types';

export abstract class BaseTransport<
  T extends TransportConfig = TransportConfig,
  U extends UserConfig = UserConfig,
  L extends LoopConfig = LoopConfig
> {
  currentWhisperName?: string;

  abstract baseUrl: string;

  constructor(readonly transportConfig: T, readonly userConfig: U, readonly loopConfig: L) {}

  static async send(request: network.HTTPRequest) {
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
