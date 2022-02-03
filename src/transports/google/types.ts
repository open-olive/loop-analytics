import { TransportConfig } from '../base';

/** GoogleAnalytics expects a 'hit type' in their request. We support two of them */
export enum HitType {
  PageView = 'pageView',
  Event = 'event',
}

/** Expected props for trackEvent */
export interface EventProps {
  category: string;
  action: string;
  label?: string;
}

/** Base map for defining the category and action of each expected event, plus any custom ones */
export interface CategoryActionMap {
  [key: string]: EventProps;
  whisperDisplayed: EventProps;
  whisperClosed: EventProps;
  componentClicked: EventProps;
  componentCopied: EventProps;
}

export interface CustomDimensionOrMetric {
  index: number;
  name: string;
  value: string;
}

/** Define the necessary properties for us to connect to Google */
export interface GoogleTransportConfig extends TransportConfig {
  /** Google Analytics API version, default 1 */
  apiVersion?: number;
  /** Property tracking ID, usually UA-XXXXXXXXX-X */
  trackingId: string;
  /** A User-Agent string for the request header */
  userAgent: string;
  /** Set expectations for what categories and actions are going to be used */
  categoryActionMap: CategoryActionMap;
  /** Map custom dimension index to an alias name and set its value */
  customDimensions?: CustomDimensionOrMetric[];
  /** Map custom metric index to an alias name and set its value */
  customMetrics?: CustomDimensionOrMetric[];
}
