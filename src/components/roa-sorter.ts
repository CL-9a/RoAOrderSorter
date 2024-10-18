import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import {
  fileOpen,
  fileSave,
  FileWithHandle,
  supported,
} from "browser-fs-access";
import * as idb from "idb-keyval";

import "./drop-zone.ts";
import "./roa-list-grid.ts";
import "./roa-saved-list.ts";
import { RoaReader } from "../RoaReader.ts";
import { main } from "../main.ts";
import { LogController } from "../controllers/LogController.ts";
import { repeat } from "lit/directives/repeat.js";

main.log(`fs api supported: ${supported}`);

class RoaCategories {
  constructor(from: ArrayBuffer) {
    console.log(from);
  }

  static checkFile(file: ArrayBuffer): boolean {
    const dataView = new DataView(file);
    return dataView.getUint8(2) === 0x00 && dataView.getUint8(3) === 0x00;
  }
}

@customElement("roa-sorter")
export class RoaSorter extends LitElement {
  @property({ type: String }) type!: "stages";

  @query("roa-list-grid")
  list!: LitElement;

  @state()
  private loadedFile = false;
  @state()
  private canTryGettingPermission = false;
  @state()
  private autoSaveOnChange = false;

  private logController = new LogController(this);

  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
  `;

  render() {
    return html`
      <div style="display: flex; flex-direction: row; justify-content: space-between; height: 150px;">
        <div>
          <h1>Roa sorter (${this.type})</h1>
          <div>
            ${
              this.loadedFile
                ? html`<button @click=${this.clickZone}>
                    Pick another file
                  </button>`
                : html`
                    <div>
                      <drop-zone
                        @filesDropped=${this.onFilesDropped}
                        @click=${this.clickZone}
                      >
                        Drop or select order.roa
                      </drop-zone>
                      ${this.canTryGettingPermission
                        ? html`
                            <button @click=${this.loadFile}>
                              Or click here to open previously opened file
                            </button>
                          `
                        : nothing}
                    </div>
                  `
            }
          </div>
        </div>

        <div style="text-align: left; overflow: auto;">
          ${repeat(this.logController.value, (line) => html`<div>${line}</div>`)}
        </div>
        
        <div>
          ${
            this.loadedFile
              ? html`<roa-saved-list
                  .type=${this.type}
                  @change=${this.triggerUpdate}
                ></roa-saved-list>`
              : nothing
          }
        </div>
      </div>

      <div>
        ${
          this.loadedFile
            ? html`<button @click=${this._onClick}>Write file</button>`
            : nothing
        }
        <span title="Only available on chromium-based browser (get your ass moving, firefox!!)">
          <input id="autosave" type="checkbox" ?checked=${this.autoSaveOnChange} ?disabled=${!supported} @change=${(e: InputEvent) => this.setAutoSave((e.target as HTMLInputElement)?.checked)}></input>
          <label for="autosave">Save on change</label>
        </span>
      </div>

      <div style="padding-top: 2rem;">
        <roa-list-grid .type="${this.type}" @change=${this.onChange}></roa-list-grid>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.init();
  }

  private async init() {
    this.autoSaveOnChange = (await idb.get("setting-autosave")) || false;
    await this.loadFile();
  }

  triggerUpdate() {
    this.list.requestUpdate();
    this.requestUpdate();
  }

  private setAutoSave(enabled: boolean) {
    this.autoSaveOnChange = enabled;
    idb.set("setting-autosave", enabled);
  }

  private async onChange() {
    if (this.autoSaveOnChange && supported && (await main.fileHandleOrder)) {
      this._onClick();
    }
  }

  private async loadFile() {
    const handleOrUndefined = await main.fileHandleOrder;
    if (!handleOrUndefined) return;
    main.log("opening file...");

    if (
      (await handleOrUndefined.queryPermission({ mode: "readwrite" })) !==
      "granted"
    ) {
      if (!this.canTryGettingPermission) {
        this.canTryGettingPermission = true;
        return;
      } else {
        if (
          (await handleOrUndefined.requestPermission({ mode: "readwrite" })) !==
          "granted"
        ) {
          console.log("permission to access file denied");
          this.canTryGettingPermission = true;
          return;
        }

        this.canTryGettingPermission = false;
      }
    }

    const file = await handleOrUndefined.getFile();
    main.log("opening file... ok");
    (file as FileWithHandle).handle = handleOrUndefined;
    await this.process(file);
  }

  private async process(file: FileWithHandle) {
    console.log("process", file);
    const ab = await file.arrayBuffer();

    if (RoaReader.checkFile(ab)) {
      await main.reader.loadFile(ab);
      if (file.handle) {
        main.setFileHandle("order", file.handle);
      }
      this.loadedFile = true;
      this.triggerUpdate();
    } else if (RoaCategories.checkFile(ab)) {
      new RoaCategories(ab);
    } else {
      console.warn("Unhandled file", file);
      main.log(`Unable to parse file "${file.name}". Ignoring.`);
    }
  }

  private async onFilesDropped(e: CustomEvent<{ files: File[] }>) {
    for (const file of e.detail.files) {
      await this.process(file);
    }
  }

  private async clickZone() {
    const files = await fileOpen({
      id: "roasort",
      multiple: true,
      extensions: [".roa"],
      description: "order.roa file",
    });

    for (const file of files) {
      await this.process(file);
    }
  }

  private async _onClick() {
    const file = main.reader.writeFile();
    await fileSave(
      file,
      {
        id: "roasort",
        fileName: "order.roa",
        extensions: [".roa"],
        description: "order.roa file",
      },
      await main.fileHandleOrder,
    );
    main.log("file saved!");
  }
}
