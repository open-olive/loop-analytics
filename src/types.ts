import { whisper } from '@oliveai/ldk';

/**
 * Make sure to Title Case, keep alphabetical
 */
export enum EventName {
  ComponentClicked = 'Component Clicked',
  LoopStarted = 'Loop Started',
  WhisperClosed = 'Whisper Closed',
  WhisperDisplayed = 'Whisper Displayed',
  WhisperTriggered = 'Whisper Triggered',
}

/**
 * Categories used by GA
 */
export enum EventCategory {
  ClickEvents = 'click_events',
  Loops = 'loops',
  Whispers = 'whispers',
}

/**
 * Enforce which properties are required for each event name
 */
export type Event =
  | [
      EventName.ComponentClicked,
      EventCategory.ClickEvents,
      {
        whisper_name: string;
        component_type: whisper.WhisperComponentType;
        component_text: string;
      }
    ]
  | [EventName.LoopStarted, EventCategory.Loops]
  | [EventName.WhisperClosed, EventCategory.Whispers, { whisper_type: string }]
  | [
      EventName.WhisperDisplayed,
      EventCategory.Whispers,
      { whisper_type: string; whisper_updated: boolean }
    ]
  | [
      EventName.WhisperTriggered,
      EventCategory.Whispers,
      { whisper_type: string; triggered_from: string }
    ];
