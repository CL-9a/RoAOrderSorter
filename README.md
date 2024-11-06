=> https://cl-9a.github.io/RoAOrderSorter/ <=

A tool to read and update `order.roa` with incredible features such as drag'n'drop

## Usage notes
- You can usually find `order.roa` in `%LocalAppData%\RivalsofAether\workshop` (copy-pasting this in the Windows File Explorer address bar should work.)
- You might need to copy it somewhere else (eg. your Desktop) before Chrome can access it.
- **You should make a copy of your `order.roa` file just in case** (but as far as I tested there shouldn't be any issues.)
- You need to restart the game for changes to take effect (I was hoping the game would reload it each time it needed it but I guess not.)
- If you don't see the `order.roa` and `categories.roa` files, you need to first go to the Extras -> Workshop section in-game and move things there for the game to create the files.
- You can save workshop items to the stash (on the left), or save/load entire ordered lists in the top-right corner.
  - (I'm not sure how the game behaves when WS items are subscribed to but not present in `order.roa`, but I just figured it might be useful and nothing should break.)
- No data leaves your browser. Everything is processed locally, and workshop data is fully static (updated daily, see [Code Notes](#code-notes) below.)

If you use a Chromium-based browser (chrome, chromium, edge, anything with [FS API support](https://caniuse.com/native-filesystem-api)) it is a bit nicer as it can save the file in-place and it opens it back up automatically. On Firefox and friends, it'll have you load/save the file each time.

## Contributing
Contributions are welcome. While this tool is fully functional as it is, there's always room for improvement and it's a fun playground while making something useful. The work involves:
- a web UI using lit webcomponents (a small layer on top of the usual DOM APIs)
- building an offline-first application (PWA)
- reading(parsing)/writing(encoding) binary files
- the Native FileSystem API
- RoA

That's a fairly small Venn diagram, but if you're interested in HTML/CSS or JS then feel free to join in on the fun. If you post a PR (even incomplete) or ask questions, I can review it or give you pointers.

You can open a development environment entirely in your browser using Stackblitz: [https://stackblitz.com/~/github.com/CL-9a/RoAOrderSorter](https://stackblitz.com/~/github.com/CL-9a/RoAOrderSorter). This is probably the easiest way to get started.

If you prefer to run things locally and are web developer, you should just be able to run `yarn` then `yarn dev`.  
If you don't have node installed but you use Docker/Podman, you should be able to run the dev server in a temporary container with `docker run --rm -it -v "$PWD:/app" --workdir /app node:latest sh -c "yarn; yarn run dev"`.

### Code Notes
- This tool is built with [lit](https://lit.dev/) and a sprinkle of the [FS browser API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).
  - The code is a bit messy as the lit webcomponents actually depend on global singletons. It works, but I don't think that's how I'm supposed to use it.
- The actual decoding is in [`src/RoaReader.ts`](/src/RoaReader.ts). It's just a while loop iterating over the bytes. I'd like to rewrite it in a more declarative way (eg. with [binary-parser](https://www.npmjs.com/package/binary-parser)) eventually.
- Since this tool is fully static, the data is updated daily following the [git-scraping](https://simonwillison.net/2020/Oct/9/git-scraping/) technique:
  - The data is scraped from the workshop via the scripts in `/scripts`.
  - The data is automatically updated and the site rebuilt via a scheduled Github Actions workflow. You can see it run [here](https://github.com/CL-9a/RoAOrderSorter/actions/workflows/update-data.yaml).
  - All data is saved to the `data` branch so that the `main` branch is not bogged down by thousands of images and automated commits.  
    This branch should not be merged back into upstream `main` (the CI merges it locally before building, but doesn't push.)

## License
The code is under the [Unlicense](./LICENCE.md), except data saved in the [`public/wsdata/` dir of the `data` branch](https://github.com/CL-9a/RoAOrderSorter/tree/data/public/wsdata) which is public data listed on the Steam Workshop.

Note that the automated scraping scripts don't handle removing items after they are unlisted from the workshop (they'd need to re-crawl the entire workshop each time, which is a lot of work compared to how rarely unlistings happen.)  
If you wish to see data hard-deleted from this repo after unlisting it from the Workshop for some reason, feel free to reach out, though again _only if you actively want the data wiped_: there's no need to "clean" things here, as unused data is simply unused (and it's work for me to hard-delete it.) Think of it as deleting a screenshot of the WS page that was posted 8 months ago on discord, instead of as spring cleaning.
