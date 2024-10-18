import { addLog } from "./controllers/LogController";
import { Groups } from "./types";

type _Data = {
  title: string;
};

export type ModData =
  | { isWS: false; path: string }
  | { isWS: true; wsId: string; path: string; data: _Data | undefined };

export class WsDataMiddleman {
  private promise: Promise<unknown>;
  private data = new Map<string, _Data>();

  constructor() {
    this.promise = Promise.all([this.load("stages"), this.load("characters")]);
  }

  private async load(group: Groups) {
    const url = `/wsdata/${group}.ndjson`;
    addLog(`Loading data for ${group}...`);
    for await (const wsItem of streamNDJSON(url)) {
      // TODO validate
      this.data.set(wsItem.id, wsItem);
    }
    addLog(`Loading data for ${group}... ok`);
  }

  async get(path: string): Promise<ModData> {
    const isWS = path.includes("workshop\\content\\383980\\");

    if (!isWS) {
      return { isWS, path } as const;
    }
    const wsId = path.split("\\").at(-1) || null;
    if (wsId === null) {
      console.warn("Couldn't extract wsID from", path);
      return { isWS: false, path } as const;
    }

    await this.promise;
    const data = this.data.get(wsId);
    return { isWS: true, wsId, path, data: data };
  }
}

const safeParseJSON = <T>(
  str: string,
): { ok: true; data: T } | { ok: false; error: unknown } => {
  try {
    return { ok: true, data: JSON.parse(str) } as const;
  } catch (e) {
    return { ok: false, error: e } as const;
  }
};

async function* streamNDJSON(url: string): AsyncGenerator<any, void, unknown> {
  const response = await fetch(url);
  if (!response.body) {
    console.warn("ReadableStream not supported or response has no body");
    const txt = await response.text();
    for (const line of txt.split("\n")) {
      const parseRes = safeParseJSON(line);
      if (parseRes.ok) yield parseRes.data;
      else console.error("Error parsing JSON:", parseRes.error, line);
    }

    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let partialLine = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (partialLine.length > 0) {
        const parseRes = safeParseJSON(partialLine);
        if (parseRes.ok) yield parseRes.data;
        else
          console.error(
            "Error parsing last partialLine JSON:",
            parseRes.error,
            partialLine,
          );
      }
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");
    for (const line of lines) {
      partialLine += line;
      if (partialLine) {
        const parseRes = safeParseJSON(partialLine);
        if (parseRes.ok) {
          yield parseRes.data;
          partialLine = "";
        }
      }
    }
  }
}
