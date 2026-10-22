# Night Tarot

A mobile-first tarot deck you explore by swiping. All 78 cards lie shuffled and face down.

- **Swipe left** to pass the top card. The next one comes forward.
- **Swipe right** to turn the card over.
- **Tap a revealed card** to read its meaning.
- About 30% of cards come up reversed, and the panel then shows the reversed meaning first.

Keyboard: `←` pass, `→` reveal, `Enter` / `↑` read, `Esc` close, `S` reshuffle.

The app is plain HTML, CSS and JavaScript, with no build step and no backend. Open `index.html` or serve the folder statically (for example `npx serve .`), or publish it with GitHub Pages.

All card art is original SVG, generated in `js/art.js`. Card names and meanings live in `js/data.js`. Sounds are synthesized with Web Audio in `js/sound.js` and are muted by default. `js/app.js` holds the deck, gestures and animations. With `prefers-reduced-motion` turned on, the 3D motion becomes simple fades.
