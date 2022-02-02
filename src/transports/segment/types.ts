import { TransportConfig } from '../base';

export interface SegmentTransportConfig extends TransportConfig {
  apiVersion?: string;
  writeKey: string;
}

interface CommonProps {
  userId?: string;
  properties?: {
    whisper_name?: string;
    loop_name?: string;
  };
}

type IdentifyProps = {
  event?: never;
  name?: never;
  traits: {
    email_domain: string;
    organization: string;
    operating_system: string;
  };
} & CommonProps;

type PageProps = {
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
