# Segment LDK

This wrapper library makes use of [Segment](https://segment.com/docs/) to send loop data to analytics services like GA and Mixpanel. It's intent is to make it easier for developers to add analytics to loops, reduce code bloat and most importantly to be consistent with event trigger names/labels. Feel free to change the types to match event trigger names specific for your use case.

## How to use

In the root file that starts the loop, add the following ahead of prior code.

```
import User from '../user';
import Segment from 'loop-segment';

  /*
  * We are using userId from user.jwt() aptitude (part of @oliveai/ldk) which has been
  * abstracted to a separate class User. But the Segment userId can be populated from other
  * id sources to fit your use case.
  */
  const { userId } = await User.getUser();
  Segment.init({
    loopName: 'KnowledgeReference Loop',
    userId,
    writeKey: 'this is found in segment sources settings',
  });
```

You should receive a Segment tracking event in your account, that says "Loop Started"

To use the rest of the methods, add them in where necessary in the code (E.g. `Segment.whisperDisplayed(Markdown, true)`). Be sure to update the `types` when creating new event names to be triggered in the loops.

## Important Notes

- Be sure to add the network and user permissions in your loop like so,

```
      "network": {
        "urlDomains": [
          {
            "value": "api.segment.io"
          }
        ]
      },
      "user": {
        "optionalClaims": [
          {
            "value": "email"
          }
        ]
      }
```
