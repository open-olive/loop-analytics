import { TransportConfig, UserConfig } from '../base';

/** Define the necessary properties for us to connect to Segment */
export interface SegmentTransportConfig extends TransportConfig {
  /** Segment API version, default v1 */
  apiVersion?: string;
  /** Segment write key, will be converted to the appropriate auth header automatically */
  writeKey: string;
}

export interface SegmentUserConfig extends UserConfig {
  emailDomain: string;
  organization: string;
  operatingSystem: string;
}

export interface CommonProps {
  userId?: string;
  properties?: {
    whisper_name?: string;
    loop_name?: string;
  };
}

export type IdentifyProps = {
  event?: never;
  name?: never;
  traits: {
    email_domain: string;
    organization: string;
    operating_system: string;
  };
} & CommonProps;

export type PageProps = {
  event?: never;
  name: string;
  properties: { whisper_updated: boolean };
} & CommonProps;

export type TrackProps = {
  event: string;
  name?: never;
  properties: { component_type?: string };
} & CommonProps;

export type SegmentProps = IdentifyProps | PageProps | TrackProps;
