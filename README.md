# Night Tarot

A mobile-first tarot app you explore by swiping. It opens by asking which of seven historical decks to use. That deck is then shuffled face down.

| Deck | Era | Cards | Scans |
| --- | --- | --- | --- |
| Visconti-Sforza | 1450s, Milan | 78 | Pierpont Morgan–Bergamo deck. Its lost cards are filled with stand-ins: the King of Cups, Knight of Coins and Three of Swords from the Cary-Yale Visconti deck (same workshop), the Tower from the 15th-century "Charles VI" tarot, and the Devil as a fragment of the Cary Sheet (Milan, c. 1500). |
| Sola Busca | 1491, Italy | 78 | Complete. |
| Minchiate | 1500s, Florence | 97 | A Florentine printing from 1860–1890. Includes the extra trumps: virtues, elements and zodiac. |
| Tarot de Marseille | 1600s–1700s, France | 78 | Arnoult edition, 1748 (BnF). |
| Etteilla | 1780s, Paris | 78 | Pussey edition (BnF). Jugement and Mortalité come from another copy of the Pussey edition and Folie from the Grimaud printing. The Aces of Cups and Swords still show placeholders. |
| Oswald Wirth | 1889, Paris | 22 | The Major Arcana, as Wirth published them. |
| Rider Waite Smith | 1909, London | 78 | The 1909 "Roses & Lilies" first edition. |

All images are public-domain scans from Wikimedia Commons, recompressed into `decks/`. `js/decks.js` is generated. It maps each scan to its card, its number on that deck and the name printed on the card.

## How to use it

- **Swipe left** to pass the card. **Swipe right** to turn it over. **Tap** a revealed card to read its meaning.
- About 30% of cards come up reversed, and the panel then shows the reversed meaning first.
- Tap the deck name at the top to switch decks. Each deck remembers where you were.
- The history button (two cards) shows the cards you have revealed in a single line, each as large as the screen allows, with its long side across the short side of the screen. On an upright phone the cards lie sideways in one column; turned sideways, they stand in one row. It opens at the newest card: scroll back for earlier ones, or tap a card to read it again. **Start new** (tap twice) clears the revealed cards and reshuffles the deck.
- Keyboard: `←` pass, `→` reveal, `Enter` / `↑` read, `Esc` close, `S` reshuffle, `D` change deck, `H` history.

## The code

Plain HTML, CSS and JavaScript, with no build step and no backend.

- `js/data.js`: meanings, including the extra Minchiate and Etteilla trumps.
- `js/backs.js`: a card back for each deck.
- `js/netlify.js` and a rule at the top of `css/style.css`: hide the badge and toolbar that Netlify injects into the page.
- `js/app.js`: the deck, gestures and animations.
