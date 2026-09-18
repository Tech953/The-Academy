# Bulletin screen-reader verification

The bulletin repair cue is intentionally platform-specific:

- Android relies on the `polite` live region. Do not add a second explicit
  announcement, or TalkBack may read the same cue twice.
- iOS uses one `announceForAccessibility` call when the bulletin changes from
  fully remote to repaired. The cue is not announced again on rerender.
- A fully remote bulletin has no repair cue in either platform.

## Manual release check

Run this on a preview build with one Android device and one iPhone. Record the
device model, OS version, app build, date, and result in the release handoff
notes.

### Android TalkBack

1. Enable TalkBack and set speech volume to an audible level.
2. Start a fresh Academy session and move focus to the campus bulletin.
3. With a fully remote bulletin, swipe through the bulletin once. Confirm that
   no repair announcement is spoken.
4. Trigger a refresh with incomplete remote events so deterministic local events
   are included, then wait for the bulletin to settle.
5. Confirm TalkBack announces exactly one concise cue equivalent to
   “LOCAL EVENTS INCLUDED — BULLETIN CONTINUES,” with a normal/polite
   interruption level.
6. Focus the bulletin again. Confirm the visible repair text is read once and
   is not duplicated by another live-region announcement.

### iOS VoiceOver

1. Enable VoiceOver and set speech volume to an audible level.
2. Repeat the fully remote check. Confirm there is no repair announcement.
3. Trigger the repaired bulletin state and wait for the refresh to finish.
4. Confirm VoiceOver announces exactly one concise repair cue and does not
   interrupt the current interaction.
5. Trigger a harmless rerender or revisit the screen without changing the
   repaired state. Confirm the cue is not announced again.
6. Focus the bulletin manually. Confirm the repair text is understandable and
   is not spoken twice.

## Workspace verification status

Automated semantic checks cover the Android live-region contract, the iOS
one-shot transition, the fully remote no-cue case, and all supported locales.
Physical TalkBack and VoiceOver runs are **not available in this Linux
workspace** because no Android/iOS device tooling or attached devices are
present; complete the manual checklist before a native release.