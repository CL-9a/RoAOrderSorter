=> https://cl-9a.github.io/RoAOrderSorter/ <=

A tool to read and update `order.roa` with incredible features such as drag'n'drop

You can usually find `order.roa` in `%LocalAppData%\RivalsofAether\workshop` (copy-pasting this in the Windows File Explorer address bar should work). You might need to copy it somewhere else (eg. Desktop) so that Chrome can access it.

**You should make a copy of your `order.roa` file just in case anyway** but as far as I tested it works.

---

You need to restart the game for changes to take effect (I was hoping the game would reload it each time it needed it but I guess not.)

If you use a Chromium-based browser (chrome, chromium, edge, NOT brave, [see here](https://caniuse.com/native-filesystem-api)) it is a bit nicer as it can save the file in-place and it opens it back up automatically. On Firefox and friends, it'll have you load/save the file each time.

As usual, no data leaves your browser.

---

Built with [lit](https://lit.dev/) and the [FS browser API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

The code is a bit messy as the lit webcomponents actually depend on global singletons. The actual decoding is in `src/RoaReader.ts` (the parsing is questionable too but hey it works.)

The data is scraped from the workshop via the scripts in `/scripts` running on a cron on Github Actions and saved into the `data` branch ([git-scraping](https://simonwillison.net/2020/Oct/9/git-scraping/).)

## Contributing

You can open a development environment entirely in your browser using Stackblitz: [https://stackblitz.com/~/github.com/CL-9a/RoAOrderSorter](https://stackblitz.com/~/github.com/CL-9a/RoAOrderSorter). This is probably the easiest way to get started.

If you prefer to run things locally and are webdeveloper, you should just be able to run `yarn` then `yarn dev`.
Or if you don't have node installed but you use Docker/Podman, you should be able to run the dev server in a temporary container with `docker run --rm -it -v "$PWD:/app" --workdir /app node:latest sh -c "yarn; yarn run dev"`.
