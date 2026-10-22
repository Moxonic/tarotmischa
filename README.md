# Night Tarot

A mobile-first tarot app you explore by swiping. It opens by asking which of seven historical decks to use. That deck is then shuffled face down.

| Deck | Era | Cards | Scans |
| --- | --- | --- | --- |
| Visconti-Sforza | 1450s, Milan | 78 | Pierpont Morgan–Bergamo deck. The Devil, Tower, Three of Swords and Knight of Coins are lost, and there is no public scan of the King of Cups. These cards show placeholders. |
| Sola Busca | 1491, Italy | 78 | Complete. |
| Minchiate | 1500s, Florence | 97 | A Florentine printing from 1860–1890. Includes the extra trumps: virtues, elements and zodiac. |
| Tarot de Marseille | 1600s–1700s, France | 78 | Arnoult edition, 1748 (BnF). |
| Etteilla | 1780s, Paris | 78 | Pussey edition (BnF). Five cards are missing from the scanned copy. |
| Oswald Wirth | 1889, Paris | 22 | The Major Arcana, as Wirth published them. |
| Rider Waite Smith | 1909, London | 78 | The 1909 "Roses & Lilies" first edition. |

All images are public-domain scans from Wikimedia Commons, recompressed into `decks/`. `js/decks.js` is generated. It maps each scan to its card, its number on that deck and the name printed on the card.

## How to use it

- **Swipe left** to pass the card. **Swipe right** to turn it over. **Tap** a revealed card to read its meaning.
- About 30% of cards come up reversed, and the panel then shows the reversed meaning first.
- Tap the deck name at the top to switch decks. Each deck remembers where you were.
- Keyboard: `←` pass, `→` reveal, `Enter` / `↑` read, `Esc` close, `S` reshuffle, `D` change deck.

## The code

Plain HTML, CSS and JavaScript, with no build step and no backend.

- `js/data.js`: meanings, including the extra Minchiate and Etteilla trumps.
- `js/backs.js`: a card back for each deck.
- `js/sound.js`: optional synthesized sound.
- `js/netlify.js`: closes or hides any badge or drawer that Netlify injects into the page.
- `js/app.js`: the deck, gestures and animations.
