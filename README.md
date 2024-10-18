=> https://cl-9a.github.io/RoAOrderSorter/ <=

A tool to read and update `order.roa` with incredible features such as drag'n'drop

**You should make a copy of your `order.roa` file just in case** but as far as I tested it works.

You need to restart the game for changes to take effect (I was hoping the game would reload it each time it needed it but I guess not.)

If you use a Chromium-based browser (chrome, chromium, edge, NOT brave, [see here](https://caniuse.com/native-filesystem-api)) it is a bit nicer as it can save the file in-place and it opens it back up automatically. On Firefox and friends, it'll have you load/save the file each time.

As usual, no data leaves your browser.

---

Built with [lit](https://lit.dev/) and the [FS browser API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

The code is a bit messy as the lit webcomponents actually depend on global singletons. The actual decoding is in `src/RoaReader.ts` (the parsing is questionable too but hey it works.)

Data is straight up crawled from the workshop.
