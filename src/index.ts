import { network, whisper } from '@oliveai/ldk';

import { Event, EventCategory, EventName } from './types';

export * from './types';

interface Config {
  loopName: string;
  userId: string;
  writeKey: string;
}

export default class Segment {
  static BASE_URL = 'https://api.segment.io/v1';

  static loopName: string;

  static userId: string;

  static writeKey: string;

  // Assigns config properties to connect to correct segment API
  static async init(config: Config) {
    Segment.loopName = config.loopName;
    Segment.writeKey = config.writeKey;
    Segment.userId = config.userId;

    this.trackLoopStarted();
  }

  // Sends events to Segment depending on action taken in loop
  static async track(...[event, category, props]: Event) {
    if (!Segment.loopName || !Segment.userId) {
      throw new Error('Analytics not initialized');
    }
    const properties = {
      loop_name: Segment.loopName,
      ...props,
    };
    const request: network.HTTPRequest = {
      url: `${Segment.BASE_URL}/track`,
      method: 'POST',
      headers: {
        Authorization: [`Basic ${btoa(`${Segment.writeKey}:`)}`],
        'Content-Type': ['application/json'],
      },
      body: JSON.stringify({
        userId: Segment.userId,
        event,
        properties: {
          ...properties,
          category,
          label: properties
            ? Object.entries(properties)
                .map(([k, v]) => `[${k}: ${v}]`)
                .join(' ')
            : undefined,
        },
      }),
    };
    const { statusCode, body } = await network.httpRequest(request);
    if (statusCode >= 200 && statusCode <= 300) {
      console.log('Successfully added tracking event');
    } else {
      console.error(`Unable to send to segment, due to ${statusCode}: ${body}`);
    }
  }

  static async trackComponentClicked(
    whisperName: string,
    componentType: whisper.WhisperComponentType,
    componentText: string
  ) {
    let sanitizedText: string;
    try {
      sanitizedText = new URL(componentText).host;
    } catch {
      sanitizedText = componentText;
    }

    Segment.track(EventName.ComponentClicked, EventCategory.ClickEvents, {
      whisper_name: whisperName,
      component_type: componentType,
      component_text: sanitizedText,
    });
  }

  static async trackLoopStarted() {
    Segment.track(EventName.LoopStarted, EventCategory.Loops);
  }

  static async trackWhisperClosed(whisperType: string) {
    Segment.track(EventName.WhisperClosed, EventCategory.Whispers, {
      whisper_type: whisperType,
    });
  }

  static async trackWhisperDisplayed(whisperType: string, whisperUpdated: boolean) {
    Segment.track(EventName.WhisperDisplayed, EventCategory.Whispers, {
      whisper_type: whisperType,
      whisper_updated: whisperUpdated,
    });
  }

  // To be removed if considered redundant
  static async trackWhisperTriggered(whisperType: string, triggeredFrom: string) {
    Segment.track(EventName.WhisperTriggered, EventCategory.Whispers, {
      whisper_type: whisperType,
      triggered_from: triggeredFrom,
    });
  }
}
