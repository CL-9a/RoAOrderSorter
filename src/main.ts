import { ReactiveController, ReactiveControllerHost } from "lit";
import * as idb from "idb-keyval";
import { openDB, DBSchema } from "idb";
import { WsDataMiddleman } from "./DataMiddleman";
import { RoaReader } from "./RoaReader";
import { addLog } from "./controllers/LogController";

export class SavedListController implements ReactiveController {
  host: ReactiveControllerHost;
  value: string[] = [];

  constructor(host: ReactiveControllerHost, timeout = 1000) {
    (this.host = host).addController(this);
  }
  hostConnected() {}
  hostDisconnected() {}
}

interface MyDB extends DBSchema {
  "lists-stages": {
    key: string;
    value: string[];
  };
  "lists-characters": {
    key: string;
    value: string[];
  };
}
const dbP = openDB<MyDB>("roa", 1, {
  upgrade(db) {
    db.createObjectStore("lists-stages");
    db.createObjectStore("lists-characters");
  },
});

class BigGremlinSingleton {
  public dataStore = new WsDataMiddleman();
  public reader: RoaReader;
  fileHandleOrder = idb.get<FileSystemFileHandle>("filehandle-order");
  private dbP = dbP;

  constructor() {
    this.reader = new RoaReader();
  }

  setFileHandle(key: "order", handle: FileSystemFileHandle) {
    this.fileHandleOrder = Promise.resolve(handle);
    idb.set(`filehandle-${key}`, handle);
  }

  loadFile(file: ArrayBuffer) {
    this.reader.loadFile(file);
  }

  log(str: string) {
    addLog(str);
  }

  async getSavedLists(type: "stages" | "characters") {
    if (!type) throw new Error("getSavedLists no type");
    this.log("Loading saved lists...");
    return (await this.dbP).getAllKeys(`lists-${type}`);
  }

  async getSavedList(type: "stages" | "characters", name: string) {
    return await (await this.dbP).get(`lists-${type}`, name);
  }
  async loadSavedList(type: "stages" | "characters", name: string) {
    const list = await this.getSavedList(type, name);
    if (!list) return false;
    this.log("Loading saved list...");

    this.reader[type] = list;
    return true;
  }

  async delSavedList(type: "stages" | "characters", name: string) {
    this.log("Deleting saved list...");
    return (await this.dbP).delete(`lists-${type}`, name);
  }

  async setSavedList(
    type: "stages" | "characters",
    name: string,
    val: string[],
  ) {
    this.log("Saving list...");
    return (await this.dbP).add(`lists-${type}`, val, name);
  }

  async storeCurrentList(type: "stages" | "characters", name: string) {
    return this.setSavedList(type, name, this.reader[type]);

    // TODO: load to reader
    // TODO: how to notify? roa-sorter does it?
  }
}

export const main = new BigGremlinSingleton();
