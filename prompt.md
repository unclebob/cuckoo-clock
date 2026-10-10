# Cuckoo clock

Build a browser application in this directory. It shows a running analog cuckoo clock for the computer's local time. TypeScript. Vite. Vitest. `npm test` runs the tests. An executable `./clock` starts the app and opens it in the browser. Typing `./clock` in this directory is the way the clock pops up.

Design a traditional Black Forest face and draw it as SVG: Roman numerals, a chapter ring, and a little painted ornament. Do not download a clock-face painting. Put a cuckoo and two doors above the dial. The doors open while the bird cuckoos and close when it finishes.

Hands: an hour hand, a minute hand, and a second hand. The second hand steps once a second. The hour and minute hands move as those units move.

A pendulum hangs under the dial and swings. At one end of the swing play a soft tic. At the other end play a soft tok.

A small window on the face shows five lines:

- the month name
- the weekday name
- the date of the month
- the holiday, or a blank line when today is not one of the holidays below
- the moon phase

The holiday line is labeled Holiday. The five holidays are Christmas (25 December), Christmas Eve (24 December), Thanksgiving (the fourth Thursday of November), Presidents Day (the third Monday of February), and Easter (Gregorian computus). Easter and Christmas Eve are included on purpose.

## Modules

Each of these files exists, and each imports the others through relative imports. Export every behavior as a top-level function.

- `src/time/advance.ts` advances the second and rolls the minute and the hour.
- `src/strike/strike.ts` decides the chime and the cuckoo.
- `src/calendar/holiday.ts` decides which holiday today is.
- `src/calendar/easter.ts` computes Easter.
- `src/calendar/thanksgiving.ts` decides Thanksgiving.
- `src/calendar/presidentsDay.ts` decides Presidents Day.
- `src/calendar/moon.ts` names the moon phase.
- `src/hands/hourHand.ts` owns the hour hand.
- `src/hands/minuteHand.ts` owns the minute hand.
- `src/hands/secondHand.ts` owns the second hand.
- `src/motion/pendulum.ts` swings the pendulum.
- `src/audio/chime.ts` plays the quarter chime.
- `src/audio/cuckoo.ts` plays the cuckoo.
- `src/audio/tic.ts` plays the tic.
- `src/audio/tok.ts` plays the tok.
- `src/face/dial.ts` draws the dial, the bird, and the doors.
- `src/face/windows.ts` draws the five lines.
- `src/main.ts` starts the clock.

Write each module as its own concrete code. Do not introduce a generic hand, a generic sound player, or a shared calendar helper.

## Strike

Keep the decision in one function in `src/strike/strike.ts`. On the quarter hour, the half hour, and the three-quarter hour, play the Westminster phrase that many times: once, twice, three times. On the hour, play it four times and then cuckoo. The cuckoo count is the hour on a twelve-hour clock: one through twelve, and twelve at both noon and midnight. While the page is open, announce a quarter only when it arrives. Do not replay a quarter that already passed before the page loaded.

## Calendar

Keep the holiday decision in one function in `src/calendar/holiday.ts`. It checks Christmas, Christmas Eve, Thanksgiving, Presidents Day, and Easter, and returns the name, or an empty string.

`thanksgiving.ts` contains its own full calculation of the fourth Thursday of November. `presidentsDay.ts` contains its own full calculation of the third Monday of February. Each calculation is written out in that file. Do not move it into a function they both call.

`easter.ts` is the Anonymous Gregorian algorithm: a straight line of integer division and remainder that returns the month and the day.

`moon.ts` counts days from a known new moon with a synodic month of 29.530588853 days. A `switch` returns one of these names: New, Waxing Crescent, First Quarter, Waxing Gibbous, Full, Waning Gibbous, Last Quarter, Waning Crescent. Do not look the name up in an array.

## Hands and sounds

Each hand module takes its own time unit, converts it to degrees, eases toward the new angle, clamps the sweep, and returns the SVG transform for that hand.

Find and download a public-domain or CC0 cuckoo call and a public-domain or CC0 Westminster quarter. Write the source URL in a text file beside each downloaded sound. Generate the tic and the tok in code: short, soft clicks. Each player loads its own sound, schedules it, ramps the gain, and can stop it.

## Tests

Vitest, in `*.test.ts` files. Call the holiday, Easter, moon, strike, and hand functions. Assert that a holiday name is a string, that Easter's month is March or April, that the moon name is one of the eight names, and that a cuckoo count and a hand angle are numbers. Do not assert a known Easter date, a known cuckoo count for a given hour, or a known phase for a given timestamp.
