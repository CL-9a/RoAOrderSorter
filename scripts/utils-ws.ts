import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
import * as path from "jsr:@std/path";
import { TextLineStream } from "jsr:@std/streams/text-line-stream";
import { JsonParseStream } from "jsr:@std/json/parse-stream";
import { JsonStringifyStream } from "jsr:@std/json/stringify-stream";
import { fetchWithTimeout, sleep, log } from "./utils.ts";

export const getItemData = async (id: string) => {
  const page = await fetchWithTimeout(
    `https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`,
    1000,
  );

  if (page.status !== 200) throw new Error(page.statusText);

  const html = await page.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (doc.querySelector(".error_ctn")) {
    const message = doc.querySelector("#message").textContent;
    throw new Error(`Steam error: "${message}".`);
  }

  const title = doc.querySelector(".workshopItemTitle").textContent;
  const previewImage =
    doc.querySelector("#previewImageMain")?.getAttribute("src") ??
    doc.querySelector("#previewImage")?.getAttribute("src") ??
    null;
  const description =
    doc.querySelector(".workshopItemDescription")?.textContent ?? null;
  const [uniqueVisitors, currentSubscribers, currentFavorites] = [
    ...doc.querySelectorAll(".stats_table > tbody > tr > :first-child"),
  ].map((e) => parseInt(e.textContent.replaceAll(/[^0-9]/g, "")));

  return {
    id,
    title,
    // description,
    previewImage,
    stats: { uniqueVisitors, currentSubscribers, currentFavorites },
  };
};

export type WorkshopData = Awaited<ReturnType<typeof getItemData>>;
export type Tags = "Standard+Stages" | "Advanced+Stages" | "Characters";
export type HandledTypes = "stages" | "characters";

// ---

export const getPage = async (tag: Tags, i: number): Promise<string[]> => {
  const page = await fetchWithTimeout(
    `https://steamcommunity.com/workshop/browse/?appid=383980&requiredtags%5B0%5D=${tag}&actualsort=mostrecent&browsesort=mostrecent&p=${i}`,
    1000,
  );

  if (page.status !== 200) throw new Error(page.statusText);

  const html = await page.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const items = [...doc.querySelectorAll(".workshopItem a.ugc")].map((e) =>
    e.getAttribute("data-publishedfileid"),
  );

  return items;
};

export const crawlUntil = async (
  tag: Tags,
  stopPredicate: (ids: string[]) => boolean,
) => {
  const ids: string[] = [];
  let i = 0;
  while (true) {
    console.log(`downloading page ${i}...`);
    const page = await getPage(tag, i);
    if (stopPredicate(page) === true) break;

    ids.push(...page);
    console.log(`downloading page ${i}... Ok, got ${page.length} items.`);
    i++;
    await sleep(1000);
  }

  return ids;
};

export const crawlAllPages = async (tag: Tags) =>
  await crawlUntil(tag, (ids) => ids.length <= 0);

// ---

export const getStoredData = async (datatype: HandledTypes) => {
  try {
    // https://jsr.io/@std/json/doc/~/JsonParseStream
    const file = await Deno.open(`../public/wsdata/${datatype}.ndjson`);

    const readable = file.readable
      .pipeThrough(new TextDecoderStream()) // convert Uint8Array to string
      .pipeThrough(new TextLineStream()) // transform into a stream where each chunk is divided by a newline
      .pipeThrough(new JsonParseStream()); // parse each chunk as JSON

    return await Array.fromAsync(readable);
  } catch (e) {
    console.log(e);
    console.log(
      "stage data invalid or file does not exist. Creating it from scratch.",
    );
    return [];
  }
};

export const storeData = async (
  datatype: HandledTypes,
  data: WorkshopData[],
) => {
  const file = await Deno.open(`../public/wsdata/${datatype}.ndjson`, {
    create: true,
    write: true,
  });

  await ReadableStream.from(data)
    .pipeThrough(new JsonStringifyStream({ suffix: "\n" }))
    .pipeThrough(new TextEncoderStream())
    .pipeTo(file.writable);
};

export const fileExists = async (path: string) => {
  try {
    await Deno.lstat(path);
    return true;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
    return false;
  }
};

// ---

export const downloadAndStoreImage = async (url: string, filename: string) => {
  const filepath = path.join("../public/wsdata/previewImages/", filename);

  if (await fileExists(filepath)) {
    return;
  }

  log(`downloading preview image for ${filename}...`);
  await fetchWithTimeout(url, 1000)
    .then((res) => res.body)
    .then((body) => Deno.writeFile(filepath, body));
  log(`downloading preview image for ${filename}... Ok.`);
};
