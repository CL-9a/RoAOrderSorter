import { ReactiveController, ReactiveControllerHost } from "lit";
import { Groups } from "../types.ts";

export class StashController implements ReactiveController {
  host: ReactiveControllerHost;
  value: string[];

  constructor(
    host: ReactiveControllerHost,
    private group: Groups,
  ) {
    (this.host = host).addController(this);
    if (!group) throw new Error("getStash(): no group");
    this.value = this._getStash(group);
  }

  private _getStash(group: Groups) {
    try {
      return JSON.parse(window.localStorage.getItem(`stash-${group}`) || "[]");
    } catch (e) {
      return [];
    }
  }
  hostConnected() {}
  hostDisconnected() {}

  delIndex(index: number) {
    const val = this.value.splice(index, 1);
    this.host.requestUpdate();
    this.save();
    return val[0];
  }

  addIndex(index: number, elem: string) {
    this.value.splice(index, 0, elem);
    this.save();
  }

  switchItems(i1: number, i2: number) {
    if (this.value[i2])
      [this.value[i2], this.value[i1]] = [this.value[i1], this.value[i2]];
    else {
      this.value.splice(i2, 0, this.value.splice(i1, 1)[0]);
    }

    this.save();
    this.host.requestUpdate();
  }

  save() {
    window.localStorage.setItem(
      `stash-${this.group}`,
      JSON.stringify(this.value),
    );
  }
}
