import { whisper } from '@oliveai/ldk';

/**
 * Define each of the requests we can make to Segment with expected body fields
 */
export type SegmentRequest =
  | ['identify', { traits: { emailDomain: string }; properties?: Record<string, string> }]
  | [
      'page',
      {
        name: string;
        properties: { whisper_updated: boolean; url: string };
      }
    ]
  | [
      'track',
      {
        event: string;
        properties: { whisper_name: string; category: string; label?: string };
      }
    ];

/**
 * All of the event names we are tracking
 *
 * Make sure to Title Case and keep alphabetical
 */
export enum EventName {
  ComponentClicked = 'Component Clicked',
  ComponentCopied = 'Component Copied',
  LoopStarted = 'Loop Started',
  WhisperClosed = 'Whisper Closed',
  WhisperDisplayed = 'Whisper Displayed',
  WhisperTriggered = 'Whisper Triggered',
}

/**
 * Categories used by GA
 *
 * Make sure to snake_case and keep alphabetical
 */
export enum EventCategory {
  ClickEvents = 'Click Events',
  Loops = 'Loops',
  Whispers = 'Whispers',
}

/**
 * Enforce which properties are required for each event name
 *
 * Make sure property keys are snake_case
 */
export type Event =
  | [
      EventName.ComponentClicked | EventName.ComponentCopied,
      EventCategory.ClickEvents,
      {
        component_type: whisper.WhisperComponentType;
      }
    ]
  | [EventName.LoopStarted, EventCategory.Loops]
  | [EventName.WhisperClosed, EventCategory.Whispers]
  | [
      EventName.WhisperDisplayed,
      EventCategory.Whispers,
      { whisper_name: string; whisper_updated: boolean }
    ]
  | [
      EventName.WhisperTriggered,
      EventCategory.Whispers,
      { triggered_from: string; whisper_name: string }
    ];
