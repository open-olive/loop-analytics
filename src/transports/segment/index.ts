import { WhisperComponentType } from '@oliveai/ldk/dist/whisper';

import { BaseTransport, LoopConfig } from '../base';
import { TrackProps, SegmentProps, SegmentTransportConfig, SegmentUserConfig } from './types';

export * as SegmentTransportTypes from './types';

export class SegmentTransport extends BaseTransport<SegmentTransportConfig, SegmentUserConfig> {
  baseUrl = `https://api.segment.io/${this.transportConfig.apiVersion || 'v1'}`;

  constructor(...args: [SegmentTransportConfig, SegmentUserConfig, LoopConfig]) {
    super(...args);

    // We want to identify the user immediately after instantiating the transport
    this.identifyUser();
  }

  async identifyUser() {
    const { emailDomain, organization, operatingSystem } = this.userConfig;

    await this.send(
      this.buildRequest('/identify', {
        traits: {
          email_domain: emailDomain,
          organization,
          operating_system: operatingSystem,
        },
      })
    );
  }

  async trackWhisperDisplayed(name: string, isUpdated: boolean) {
    // Set the current whisper name so that we can use it in the event properties
    this.currentWhisperName = name;

    await this.send(
      this.buildRequest('/page', {
        name: this.currentWhisperName,
        properties: {
          whisper_updated: isUpdated,
        },
      })
    );
  }

  async trackWhisperClosed(name: string) {
    await this.trackEvent({
      event: 'Whisper Closed',
      properties: {
        whisper_name: name,
      },
    });
  }

  async trackComponentClicked(type: WhisperComponentType) {
    await this.trackEvent({
      event: 'Component Clicked',
      properties: {
        component_type: type,
      },
    });
  }

  async trackComponentCopied(type: WhisperComponentType) {
    await this.trackEvent({
      event: 'Component Copied',
      properties: {
        component_type: type,
      },
    });
  }

  async trackEvent(props: TrackProps) {
    await this.send(this.buildRequest('/track', props));
  }

  protected buildRequest(endpoint: string, props: SegmentProps) {
    return {
      method: 'POST',
      url: `${this.baseUrl}${endpoint}`,
      headers: this.buildRequestHeaders(),
      body: JSON.stringify(this.buildRequestBody(props)),
    };
  }

  private buildRequestHeaders() {
    return {
      Authorization: [
        `Basic ${Buffer.from(`${this.transportConfig.writeKey}:`).toString('base64')}`,
      ],
      'Content-Type': ['application/json'],
    };
  }

  private buildRequestBody(props: SegmentProps) {
    // Set default properties but allow them to be overridden if the method sends in values
    return {
      userId: this.userConfig.id,
      ...props,
      properties: {
        loop_name: this.loopConfig.name,
        whisper_name: this.currentWhisperName,
        ...props.properties,
      },
    };
  }
}
