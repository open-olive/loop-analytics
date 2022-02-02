import { TransportConfig } from '../base';

export enum HitType {
  PageView = 'pageView',
  Event = 'event',
}

export interface EventProps {
  category: string;
  action: string;
  label: string;
}

interface CategoryActionObj {
  category: string;
  action: string;
}

export interface CategoryActionMap {
  [key: string]: CategoryActionObj;
  whisperDisplayed: CategoryActionObj;
  whisperClosed: CategoryActionObj;
  componentClicked: CategoryActionObj;
  componentCopied: CategoryActionObj;
}

export interface GoogleTransportConfig extends TransportConfig {
  apiVersion?: number;
  trackingId: string;
  /** Set expectations for what categories and actions are going to be used */
  categoryActionMap: CategoryActionMap;
  /** Map custom dimension index to an alias name and set its value */
  customDimensions?: { index: number; name: string; value: string }[];
  customMetrics?: { index: number; name: string; value: string }[];
}
