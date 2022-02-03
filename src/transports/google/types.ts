import { TransportConfig } from '../base';

export enum HitType {
  PageView = 'pageView',
  Event = 'event',
}

export interface EventProps {
  category: string;
  action: string;
  label?: string;
}

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

export interface GoogleTransportConfig extends TransportConfig {
  apiVersion?: number;
  trackingId: string;
  userAgent: string;
  /** Set expectations for what categories and actions are going to be used */
  categoryActionMap: CategoryActionMap;
  /** Map custom dimension index to an alias name and set its value */
  customDimensions?: CustomDimensionOrMetric[];
  /** Map custom metric index to an alias name and set its value */
  customMetrics?: CustomDimensionOrMetric[];
}
