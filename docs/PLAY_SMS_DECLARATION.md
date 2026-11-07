# Google Play: Permissions Declaration Form (SMS and Call Log)

Draft answers for the form Google requires before an app may use `SEND_SMS`, `RECEIVE_SMS`, `READ_SMS`, `RECEIVE_MMS` or `RECEIVE_WAP_PUSH`. Paste, check each against the shipped app, and edit. Nothing here has been submitted.

## Core functionality

Select **Default SMS handler**. Middleman registers for the SMS role (`RoleManager.ROLE_SMS`) and implements every component the system requires of one: an `SMS_DELIVER` receiver, a `WAP_PUSH_DELIVER` receiver, a respond-via-message service, and an activity that handles `SENDTO` for `sms`, `smsto`, `mms` and `mmsto`.

## Why the app needs it (short form)

Middleman is a messaging app with one distinctive feature. When someone asks for space from another person, Middleman receives that person's texts, passes on the substance in calmer words, and texts the reply back, so the other person needs no app. Receiving their texts before any other app, and keeping them out of the ordinary inbox, is only possible for the default SMS app. For everyone else, Middleman works as an ordinary messaging app: conversation list, threads, contact names, sent and delivered marks, and picture messages.

## Permissions and what each is used for

| Permission | Use |
| --- | --- |
| `RECEIVE_SMS`, `RECEIVE_MMS`, `RECEIVE_WAP_PUSH` | Receiving texts and picture messages as the default SMS app. |
| `SEND_SMS` | Sending the user's own messages, and Middleman's replies to someone in a mediation, from the user's number. |
| `READ_SMS` | Showing conversations and threads from the system message store. |
| `READ_CONTACTS` | Showing a contact's name instead of a number. Optional; the app works without it. |
| `POST_NOTIFICATIONS` | Notifying the user of new messages. Optional. |
| `FOREGROUND_SERVICE_DATA_SYNC` | Keeping a mediation carried by text running while the app is closed. |

The app does not request the call log.

## Data handling (for the Data safety section and the review)

- A text from someone in an active mediation is sent to the Middleman server, which paraphrases it with an AI model (or a local rule-based fallback). It is written nowhere on the phone, and the whole mediation is deleted from the server when it ends, expires, or is replaced.
- The phone number of the other person never leaves the device. The server receives a display name and a one-way hash used only to recognise that the same two people are starting again.
- Texts from anyone else are filed in the system message store on the device, as any messaging app does, and are never sent to the server.
- Nothing is sold, shared for advertising, or used to train models. Retention and the full text are in `TERMS_OF_SERVICE.md` and the privacy section of `README.md`.

## Things to confirm before submitting

- The privacy policy URL on the Play listing covers the points above.
- A short screen recording of the default-SMS role prompt and a mediation by text, if the reviewer asks for a demonstration. This needs a real phone.
- Picture messages are received, stored and sent, but have not been tested against a real carrier; test before claiming MMS in the listing.
