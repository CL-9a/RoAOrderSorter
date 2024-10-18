import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { classMap } from "lit/directives/class-map.js";
import { main } from "../main.ts";
import { Groups } from "../types.ts";
import "./roa-list-grid-item.ts";
import { StashController } from "../controllers/StashController.ts";
import { addLog } from "../controllers/LogController.ts";

@customElement("trash-can")
export class TrashCan extends LitElement {
  static styles = css`
    .can {
      width: 56px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 2px;
      background-color: lightgray;
      border: 1px dashed gray;
    }
    .can.dragged-over {
      background-color: palevioletred !important;
      border: 1px dashed red !important;
    }
  `;

  @state()
  draggedover = false;

  render() {
    return html`
      <div
        class=${classMap({ can: true, "dragged-over": this.draggedover })}
        @dragenter=${this.dragstart}
        @dragleave=${this.dragend}
        @dragend=${this.dragend}
        @drop=${this.dragend}
      >
        :trashcan:
      </div>
    `;
  }

  private dragstart() {
    this.draggedover = true;
  }
  private dragend() {
    this.draggedover = false;
  }
}

@customElement("roa-list-grid")
export class RoaListGrid extends LitElement {
  @property({ type: String }) type!: Groups;
  @state() insertInsteadOfSwap: boolean = false;
  stashController!: StashController;

  static styles = css`
    .container {
      display: flex;
      gap: 10px;
    }

    .stash {
      width: 100px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      border: 1px dotted #ccc;
    }

    .grid-container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      flex-grow: 1;
      gap: 16px;
    }

    .grid {
      display: flex;
      flex-wrap: wrap;
      width: 250px;
    }

    .grid-item {
      width: 56px;
      height: 40px;
      border: 1px solid #ccc;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 2px;
      background-color: white;
      cursor: move;
    }

    .empty {
      border: none;
      cursor: default;
    }

    .grid-header {
      display: flex;
      justify-content: flex-end;
      font-size: 12px;
      margin-bottom: 4px;
    }
  `;

  private draggedElementIndex: number | null = null;
  private draggedFromStash: boolean | null = null;

  get items() {
    return main.reader[this.type];
  }
  connectedCallback(): void {
    super.connectedCallback();
    this.stashController = new StashController(this, this.type);
  }

  render() {
    const grids = this.getGrids();

    return html`
      <div>
        <div>
          <input id="insertPref" type="checkbox" ?checked=${this.insertInsteadOfSwap} @change=${(e: InputEvent) => this.insertInsteadOfSwap = (e.target as HTMLInputElement)?.checked}></input>
          <label for="insertPref">Insert instead of swap</label>
        </div>
      </div>
      <div class="container">
        <div class="grid-container">
          ${repeat(
            grids,
            (_, gridIndex) => html`
              <div>
                <div class="grid-header">
                  Page ${gridIndex + 1}/${grids.length}
                </div>
                <div class="grid">
                  ${repeat(
                    grids[gridIndex],
                    (item) => item,
                    (item, itemIndex) => {
                      if (!item) {
                        return html`<div class="grid-item empty"></div>`;
                      }

                      const index = gridIndex * 15 + itemIndex;

                      return html`
                        <roa-list-grid-item
                          .path=${item}
                          class="grid-item"
                          draggable="true"
                          @click=${(e: MouseEvent) => this.onClick(e, index)}
                          @dragstart=${(e: DragEvent) =>
                            this.handleDragStart(e, index, false)}
                          @dragover=${this.handleDragOver}
                          @drop=${(e: DragEvent) => this.handleDrop(e, index)}
                          @dragend=${this.handleDragEnd}
                        >
                        </roa-list-grid-item>
                      `;
                    },
                  )}
                </div>
              </div>
            `,
          )}
        </div>

        <div>
          <trash-can
            draggable="false"
            @drop=${this.trashcanDrop}
            @dragover=${(e: DragEvent) => e.preventDefault()}
          ></trash-can>
          <div
            class="stash"
            style="height: 100%"
            @drop=${(e: DragEvent) => this.stashDrop(e, -1)}
            @dragover=${(e: DragEvent) => e.preventDefault()}
            @dragend=${this.handleDragEnd}
          >
            <h4>Stash</h4>
            ${this.stashController.value.length === 0
              ? html`
                  <div
                    class="grid-item"
                    draggable="false"
                    @drop=${(e: DragEvent) => this.stashDrop(e, 0)}
                    @dragover=${this.handleDragOver}
                    @dragend=${this.handleDragEnd}
                  >
                    +
                  </div>
                `
              : nothing}
            ${repeat(
              this.stashController.value,
              (item, index) => html`
                <roa-list-grid-item
                  .path=${item}
                  class="grid-item"
                  draggable="true"
                  @dragstart="${(e: DragEvent) =>
                    this.handleDragStart(e, index, true)}"
                  @dragover="${this.handleDragOver}"
                  @drop="${(e: DragEvent) => this.stashDrop(e, index)}"
                  @dragend="${this.handleDragEnd}"
                >
                </roa-list-grid-item>
              `,
            )}
          </div>
        </div>
      </div>
      <div>
        Shift+click to send to stash, Ctrl+click to delete
      </div>
    `;
  }

  // WARNING if you change this itemsWithPlaceholders is an any[] so can pretend to be any type
  private getGrids(): Array<string | null>[] {
    const itemsWithPlaceholders = [
      ...this.items,
      ...new Array((15 - (this.items.length % 15)) % 15).fill(null),
    ];
    const grids = [];

    for (let i = 0; i < itemsWithPlaceholders.length; i += 15) {
      grids.push(itemsWithPlaceholders.slice(i, i + 15));
    }

    return grids;
  }

  private onClick(e: MouseEvent, index: number) {
    if (e.ctrlKey || e.metaKey) {
      const item = main.reader.removeElem(this.type, index);
      main.log(`Deleting item ${item}`);
      this.dispatchEvent(new CustomEvent("change"));
    } else if (e.shiftKey) {
      main.log(`Moving ${index} to stash`);
      const movedItem = main.reader.removeElem(this.type, index);
      this.stashController.addIndex(0, movedItem);
    }

    this.requestUpdate();
  }

  private handleDragStart(_: DragEvent, index: number, fromStash: boolean) {
    console.log("dragstart", index, fromStash);
    this.draggedElementIndex = index;
    this.draggedFromStash = fromStash;
    //this.requestUpdate();
    //e.dataTransfer?.setData('text/plain', JSON.stringify({ index: index.toString(), fromStash }));
  }

  private trashcanDrop(e: DragEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const oldIndex = this.draggedElementIndex;

    if (oldIndex === null) return;

    if (this.draggedFromStash) {
      const item = this.stashController.delIndex(oldIndex);
      main.log(`Deleting item ${item} from stash`);
    } else {
      const item = main.reader.removeElem(this.type, oldIndex);
      main.log(`Deleting item ${item}`);
      this.dispatchEvent(new CustomEvent("change"));
    }

    this.draggedElementIndex = null;
    this.draggedFromStash = null;
  }

  private stashDrop(e: DragEvent, newIndex: number) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const oldIndex = this.draggedElementIndex;
    console.log("stashDrop", oldIndex, newIndex, this.draggedFromStash);

    if (oldIndex === null) return;

    if (newIndex === -1) {
      newIndex = this.stashController.value.length;
    }

    if (this.draggedFromStash) {
      this.stashController.switchItems(oldIndex, newIndex);
    } else {
      main.log(`Moving ${oldIndex} to stash`);
      const movedItem = main.reader.removeElem(this.type, oldIndex);
      this.stashController.addIndex(newIndex, movedItem);
    }

    this.draggedElementIndex = null;
    this.draggedFromStash = null;
    this.dispatchEvent(new CustomEvent("change"));
  }

  private handleDrop(e: DragEvent, newIndex: number) {
    e.preventDefault();
    const oldIndex = this.draggedElementIndex;
    if (oldIndex === null) return;

    if (this.draggedFromStash) {
      const movedItem = this.stashController.delIndex(oldIndex);
      main.log(`Adding item ${movedItem} from stash`);
      main.reader.addElem(this.type, newIndex, movedItem);
    } else {
      if (this.insertInsteadOfSwap) {
        main.log(`Moving i${oldIndex} to ${newIndex}`);
        const movedItem = main.reader.removeElem(this.type, oldIndex);
        main.reader.addElem(this.type, newIndex, movedItem);
      }
      else {
        main.log(`Switching items ${oldIndex} and ${newIndex}`);
        main.reader.switchElems(this.type, oldIndex, newIndex);
      }
    }

    this.draggedElementIndex = null;
    this.draggedFromStash = null;
    this.dispatchEvent(new CustomEvent("change"));
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  private handleDragEnd() {
    this.draggedElementIndex = null;
    this.draggedFromStash = null;
    this.requestUpdate();
  }
}
