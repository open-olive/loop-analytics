// This shouldn't even be necessary, docs say props of objects shouldn't trigger this rule but it does?
/* eslint-disable no-param-reassign */
import { network, whisper } from '@oliveai/ldk';

import { Event, EventCategory, EventName, SegmentRequest } from './types';

interface Config {
  /** Identify the entire loop by name */
  loopName: string;
  /** Write key provided by the Segment HTTP destination */
  writeKey: string;
  /** Unique ID for the user, usually the sub prop from LDK User.jwt() */
  userId: string;
  /** Email for the user, will be stripped to only track the domain */
  userEmail: string;
}

export default class Segment {
  static BASE_URL = 'https://api.segment.io/v1';

  static config: Config;

  static currentPage: string;

  static initialized = false;

  /**
   * Initialize the library with the necessary configuration and identify the user
   */
  static async init(config: Config) {
    Segment.config = config;
    Segment.initialized = true;

    await Segment.identify();
  }

  /**
   * Identify the user with the Segment API, should only be called once at loop startup through init
   */
  static async identify() {
    const { userEmail } = Segment.config;

    await Segment.postRequest('identify', {
      traits: {
        emailDomain: userEmail.split('@')[1],
      },
    });
  }

  /**
   * Track that the user has changed view to a new page (whisper)
   */
  static async page(whisperName: string, whisperUpdated: boolean) {
    const { loopName } = Segment.config;

    Segment.currentPage = whisperName;

    await Segment.postRequest('page', {
      name: Segment.currentPage,
      properties: {
        whisper_updated: whisperUpdated,
        url: `${loopName}/${whisperName}`,
      },
    });
  }

  /**
   * Track an event
   */
  static async track(...[event, category, props]: Event) {
    await Segment.postRequest('track', {
      event,
      properties: {
        ...props,
        whisper_name: Segment.currentPage,
        category,
        label: props
          ? Object.entries(props)
              .map(([k, v]) => `[${k}: ${v}]`)
              .join(' ')
          : undefined,
      },
    });
  }

  static async trackComponentClicked(componentType: whisper.WhisperComponentType) {
    await Segment.track(EventName.ComponentClicked, EventCategory.ClickEvents, {
      component_type: componentType,
    });
  }

  static async trackWhisperClosed() {
    await Segment.track(EventName.WhisperClosed, EventCategory.Whispers);
  }

  static async trackWhisperDisplayed(whisperName: string, whisperUpdated: boolean) {
    await Segment.page(whisperName, whisperUpdated);
  }

  // To be removed if considered redundant
  static async trackWhisperTriggered(whisperName: string, triggeredFrom: string) {
    await Segment.track(EventName.WhisperTriggered, EventCategory.Whispers, {
      whisper_name: whisperName,
      triggered_from: triggeredFrom,
    });
  }

  /**
   * Sends the HTTP request to Segment based on given endpoint and body args
   *
   * Should not be called directly, use identify, page, or track instead
   */
  private static async postRequest(...[endpoint, body]: SegmentRequest) {
    if (!Segment.initialized) {
      throw new Error('Segment not initialized');
    }
    const { loopName, userId, writeKey } = Segment.config;

    const request: network.HTTPRequest = {
      url: `${Segment.BASE_URL}/${endpoint}`,
      method: 'POST',
      headers: {
        Authorization: [`Basic ${btoa(`${writeKey}:`)}`],
        'Content-Type': ['application/json'],
      },
      body: JSON.stringify({
        ...body,
        userId,
        properties: {
          ...body.properties,
          loop_name: loopName,
        },
      }),
    };

    await network.httpRequest(request);
  }
}
