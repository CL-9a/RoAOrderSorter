import { distinctBy } from "jsr:@std/collections/distinct-by";
import { sortBy } from "jsr:@std/collections/sort-by";
import {
  HandledTypes,
  Tags,
  crawlAllPages,
  getItemData,
  getStoredData,
  downloadAndStoreImage,
  storeData,
  WorkshopData,
  crawlUntil,
} from "./utils-ws.ts";
import { sleep, log, retryWithExponentialBackoff } from "./utils.ts";

const type: HandledTypes = Deno.args[0];
if (type !== "stages" && type !== "characters")
  throw new Error("unhandled type");

const data = await getStoredData(type);
const newData: WorkshopData[] = [];
const knownIds = data.map((item) => item.id);

const ids = await (async () => {
  if (type === "stages") {
    return [
      ...(await crawlUntil("Standard+Stages", (ids) =>
        ids.some((id) => knownIds.includes(id)),
      )),
      ...(await crawlUntil("Advanced+Stages", (ids) =>
        ids.some((id) => knownIds.includes(id)),
      )),
    ].sort();
  } else if (type === "characters") {
    return [
      ...(await crawlUntil("Characters", (ids) =>
        ids.some((id) => knownIds.includes(id)),
      )),
    ].sort();
  } else {
    throw new Error("This can't happen");
  }
})();

for (const id of ids) {
  if (knownIds.includes(id)) continue;

  log(`downloading item ${id}...`);
  const item = await retryWithExponentialBackoff(
    () => getItemData(id),
    3,
    1500,
  );
  log(`downloading item ${id}... Ok.`);

  if (item.previewImage) {
    await retryWithExponentialBackoff(
      () => downloadAndStoreImage(item.previewImage, `${id}.png`),
      3,
      1500,
    );
  }

  newData.push(item);

  await sleep(1000);
}

const finalData = sortBy(
  distinctBy([...data, ...newData], (item) => item.id),
  (item) => item.id,
);
await storeData(type, finalData);
