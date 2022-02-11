import { network, whisper } from '@oliveai/ldk';

import { LoopConfig, TransportConfig, UserConfig } from './types';

export * from './types';

/**
 * Abstract for all Transports to extend
 *
 * @param TransportConfig Defines properties for the Transport's client itself, such as auth keys, custom parameters, etc
 * @param UserConfig Defines properties for the user, such as their id, etc
 * @param LoopConfig Defines properties for the loop, such as the name, etc
 */
export abstract class BaseTransport<
  T extends TransportConfig = TransportConfig,
  U extends UserConfig = UserConfig,
  L extends LoopConfig = LoopConfig
> {
  // Keep track of which whisper we're on so events can tie to it as a page if needed
  currentWhisperName?: string;

  // All Transports need a baseUrl for the HTTP Requests
  abstract baseUrl: string;

  // Set up the Transport with default or extended configs
  constructor(readonly transportConfig: T, readonly userConfig: U, readonly loopConfig: L) {}

  // All Transports will be using LDK's network call, this helper method reduces redundancy
  protected static async send(request: network.HTTPRequest, debug = false) {
    const { statusCode, body } = await network.httpRequest(request);
    if (statusCode < 200 || statusCode >= 300) {
      console.error(`Request failed with status code ${statusCode}: ${request.url}`);
    }
    if (debug) {
      console.debug(`Request: ${request}`);
      console.debug(`Response: ${await network.decode(body)}`);
    }
  }

  // === Abstracts for every Transport to implement ===

  /** @see {@link AnalyticsClient.trackWhisperDisplayed} */
  abstract trackWhisperDisplayed(name: string, isUpdated: boolean): Promise<void>;

  /** @see {@link AnalyticsClient.trackWhisperClosed} */
  abstract trackWhisperClosed(name: string): Promise<void>;

  /** @see {@link AnalyticsClient.trackComponentClicked} */
  abstract trackComponentClicked(type: whisper.WhisperComponentType): Promise<void>;

  /** @see {@link AnalyticsClient.trackComponentCopied} */
  abstract trackComponentCopied(type: whisper.WhisperComponentType): Promise<void>;

  /** @see {@link AnalyticsClient.trackEvent} */
  abstract trackEvent(props: any): Promise<void>;

  /** All Transports should have a method for building the request used in Transport.send */
  protected abstract buildRequest(...args: any[]): network.HTTPRequest;
}
