# Loop Analytics Library

This library makes use of the LDK's Network aptitude to support analytics within loops through builtin analytics services or can be extended to support custom services

Currently supported out of the box:

- [Google Analytics (Universal)](https://developers.google.com/analytics/devguides/collection/protocol/v1)
- [Segment](https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/)

## How to Use

### 1. Add the necessary aptitude permissions to your loop's `package.json`

The only required aptitude is `network` to make requests to the analytics service you choose. Some other aptitudes that can be helpful are `user` for getting the user's information and `system` for getting the user's operating system.

> Note: Use the information from `user` and `system` aptitudes at your own risk. PII and PHI should **NEVER** be sent to an analytics service, only the minimum required info that is helpful for metrics should be used. If you are unsure whether your information would be considered PII or PHI or you don't need this info for your metrics, err on the side of caution and omit these aptitudes altogether.

#### Network Aptitude URLs for the provided Transports

| Transport |         URL          |
| :-------: | :------------------: |
|  Google   | google-analytics.com |
|  Segment  |    api.segment.io    |

```json
{
  ...
  "ldk": {
    "permissions": {
      "whisper": {},
      "system": {},
      "user": {
        "optionalClaims": [{ "value": "email" }]
      },
      "network": {
        "urlDomains": [{ "value": "google-analytics.com" }]
      }
    }
  }
}
```

### 2. Set up the Analytics Client with your desired Transport

In this example we setup and export the Google Analytics client in a separate file to make it accessible across the loop

```ts
// analytics.ts
import { user, system } from '@oliveai/ldk';
import { AnalyticsClient, Transports } from '@oliveai/loop-analytics';
import jwtDecode from 'jwt-decode';

import { LOOP_NAME } from './index';

const createAnalyticsClient = async () => {
  // Helper function to fetch the user's JWT and decode the payload
  const getUserInfo = async () =>
    jwtDecode<{ email: string; org: string; sub: string }>(await user.jwt({ includeEmail: true }));

  // Get the info we need from LDK
  const { sub: userId, email, org } = await getUserInfo();
  const os = await system.operatingSystem();

  // Define required and custom category/action pairings
  // Export outside of this function to use across the loop for custom events if you'd like
  const categoryActionMap: Transports.GoogleTransportTypes.CategoryActionMap = {
    // === Required ===
    whisperDisplayed: {
      category: 'Whispers',
      action: 'Whisper Displayed',
    },
    whisperClosed: {
      category: 'Whispers',
      action: 'Whisper Closed',
    },
    componentClicked: {
      category: 'Click Events',
      action: 'Component Clicked',
    },
    componentCopied: {
      category: 'Click Events',
      action: 'Component Copied',
    },
    // === Custom (Optional) ===
    customEvent: {
      category: 'Custom',
      action: 'Custom Event',
    },
  };

  // An example of how to set custom dimensions, use whatever is appropriate
  const customDimensions: Transports.GoogleTransportTypes.CustomDimensionOrMetric[] = [
    {
      index: 1,
      name: 'Loop Name',
      value: LOOP_NAME,
    },
    {
      index: 2,
      name: 'User ID',
      value: userId, // The user's generated ID in Loop Library, not considered PII
    },
    {
      index: 3,
      name: 'Email Domain',
      value: email.split('@')[1], // ONLY send the email domain, full email would be PII
    },
    {
      index: 4,
      name: 'Organization',
      value: org,
    },
    {
      index: 5,
      name: 'Operating System',
      value: os,
    },
  ];

  const transportConfig: Transports.GoogleTransportTypes.GoogleTransportConfig = {
    trackingId: 'UA-12345678-90',
    // Can be whatever you want but is required for Google's request headers
    userAgent: LOOP_NAME,
    categoryActionMap,
    customDimensions,
  };

  const userConfig: Transports.UserConfig = {
    id: userId,
  };
  const loopConfig: Transports.LoopConfig = {
    name: LOOP_NAME,
  };

  return new AnalyticsClient(
    new Transports.GoogleTransport(transportConfig, userConfig, loopConfig)
  );
};

// One example of how to export the client in a way that is accessible across the loop
export default await createAnalyticsClient();
```

### 3. Use the new Analytics Client wherever it's needed

```ts
// index.ts
import { whisper } from '@oliveai/ldk';
import GA from './analytics';

(async () => {
  const label = 'Hello World!';

  whisper.create({
    label,
    components: [],
  });

  GA.trackWhisperDisplayed(label);
})();
```
