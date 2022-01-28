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
    if (!Segment.initialized) {
      console.error(
        `Segment not initialized, skipping Identify call. Initialize with Segment.init()`
      );
      return;
    }
    const { userEmail } = Segment.config;

    Segment.postRequest('identify', {
      traits: {
        emailDomain: userEmail.split('@')[1],
      },
    });
  }

  /**
   * Track that the user has changed view to a new page (whisper)
   */
  static async page(whisperName: string, whisperUpdated: boolean) {
    if (!Segment.initialized) {
      console.error(
        `Segment not initialized, skipping Page call for [${whisperName}]. Initialize with Segment.init()`
      );
      return;
    }
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
    if (!Segment.initialized) {
      console.error(
        `Segment not initialized, skipping Track call for [${event}]. Initialize with Segment.init()`
      );
      return;
    }
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

  static async trackComponentCopied(componentType: whisper.WhisperComponentType) {
    await Segment.track(EventName.ComponentCopied, EventCategory.ClickEvents, {
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
      console.warn('Segment not initialized, but this method is private so how did you get here?');
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

    const { statusCode } = await network.httpRequest(request);
    if (statusCode < 200 || statusCode >= 300) {
      console.error(`Segment request to [${endpoint}] failed with status code [${statusCode}]`);
    }
  }
}

/**
 * Set a component's handlers to a wrapped version that will call GA then the original handler
 */
export function wrap(component: whisper.Component) {
  /**
   * This generic function accepts the existing handler and the desired event function, returns a
   * function that calls the event function and then calls the existing handler if it exists.
   *
   * TODO:  Figure out what the handler type can be without making a giant conditional type of all whisper handlers
   */
  function handlerWrapper<F extends (...args: any[]) => void>(
    handler: F | undefined,
    trackFn: () => Promise<void>
  ) {
    return async function _(...args: unknown[]) {
      await trackFn();
      if (handler) handler(...args);
    };
  }

  // === Click Handlers ===
  const onClickHandler = async () => Segment.trackComponentClicked(component.type);
  if ('onClick' in component) {
    component.onClick = handlerWrapper(component.onClick, onClickHandler);
  }
  if ('onLinkClick' in component) {
    component.onLinkClick = handlerWrapper(component.onLinkClick, onClickHandler);
  }

  // === Copy Handlers ===
  const onCopyHandler = async () => Segment.trackComponentCopied(component.type);
  if ('onCopy' in component) {
    component.onCopy = handlerWrapper(component.onCopy, onCopyHandler);
  }

  return component;
}

/**
 * Go through an array of components and their children and attempt to wrap handlers with event tracking
 *
 * TODO: Enhancements
 * 1. Define a helpful options object: force wrap undefined handlers, override names, etc.
 * 2. Extend the component type to some kind of TrackedComponent to help protect from accidentally wrapping components multiple times
 */
export function wrapComponents(components: whisper.Component[]) {
  return components.map((component) => {
    // Wrap each component in Box or CollapseBox children
    if ('children' in component) {
      component.children = wrapComponents(component.children) as typeof component.children;
      return component;
    }
    // Wrap each component in Breadcrumb children
    if ('links' in component) {
      component.links = wrapComponents(component.links) as typeof component.links;
      return component;
    }
    return wrap(component);
  });
}
