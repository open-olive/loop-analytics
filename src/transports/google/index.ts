import { whisper } from '@oliveai/ldk';

import { Transport } from '../baseTransport';
import { GoogleTransportConfig, EventProps, HitType } from './types';

export class GoogleTransport extends Transport<GoogleTransportConfig> {
  baseUrl = 'https://google-analytics.com/collect';

  async trackWhisperDisplayed(name: string, isUpdated: boolean) {
    this.currentWhisperName = name;

    await GoogleTransport.send(this.buildRequest(HitType.PageView));

    await this.trackEvent({
      ...this.transportConfig.categoryActionMap.whisperDisplayed,
      label: isUpdated ? 'Updated' : 'Created',
    });
  }

  async trackWhisperClosed(name: string) {
    await this.trackEvent({
      ...this.transportConfig.categoryActionMap.whisperClosed,
      label: name,
    });
  }

  async trackComponentClicked(type: whisper.WhisperComponentType) {
    await this.trackEvent({
      ...this.transportConfig.categoryActionMap.componentClicked,
      label: type,
    });
  }

  async trackComponentCopied(type: whisper.WhisperComponentType) {
    await this.trackEvent({
      ...this.transportConfig.categoryActionMap.componentCopied,
      label: type,
    });
  }

  async trackEvent(props: EventProps) {
    await GoogleTransport.send(this.buildRequest(HitType.Event, props));
  }

  private buildRequest(hitType: HitType, props?: EventProps) {
    return {
      method: 'POST',
      url: this.baseUrl,
      headers: {
        'User-Agent': [
          `OliveHelps @oliveai/loop-analytics ${this.loopConfig.name.replace(/ /g, '')}`,
        ],
      },
      body: this.buildRequestBody(hitType, props),
    };
  }

  private buildRequestBody(hitType: HitType, props?: EventProps) {
    const { apiVersion, trackingId, customDimensions, customMetrics } = this.transportConfig;
    const { id: userId } = this.userConfig;
    /**
     * Build an object for all of the properties we'll need to send to Google
     * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
     */
    const propStringObj: Record<string, string> = {
      v: (apiVersion || 1).toString(),
      tid: trackingId,
      uid: userId,
      t: hitType,
      dh: this.loopConfig.name,
      dp: `/${this.loopConfig.name}/${this.currentWhisperName}`,
      dt: this.currentWhisperName || '',
    };
    if (hitType === HitType.Event && props) {
      propStringObj.ec = props.category;
      propStringObj.ea = props.action;
      propStringObj.el = props.label;
    }
    customDimensions?.forEach(({ index, value }) => {
      propStringObj[`cd${index}`] = value;
    });
    customMetrics?.forEach(({ index, value }) => {
      propStringObj[`cm${index}`] = value;
    });

    return Object.entries(propStringObj)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }
}
