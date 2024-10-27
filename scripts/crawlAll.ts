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
} from "./utils-ws.ts";
import { sleep, log, retryWithExponentialBackoff } from "./utils.ts";

const type: HandledTypes = Deno.args[0];
if (type !== "stages" && type !== "characters")
  throw new Error("unhandled type");

const prevData = await getStoredData(type);
const newData: WorkshopData[] = [];

const ids = await (async () => {
  if (type === "stages") {
    return [
      ...(await crawlAllPages("Standard+Stages")),
      ...(await crawlAllPages("Advanced+Stages")),
    ].sort();
  } else if (type === "characters") {
    return [...(await crawlAllPages("Characters"))].sort();
  } else {
    throw new Error("This can't happen");
  }
})();

for (const id of ids) {
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
  distinctBy([...prevData, ...newData], (item) => item.id),
  (item) => item.id,
);
await storeData(type, finalData);
