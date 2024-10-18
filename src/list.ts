import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { repeat } from "lit/directives/repeat.js";
import { RoaReader } from "./RoaReader";

@customElement("roasort-list")
export class RoasortList extends LitElement {
  @property({ type: Array }) items: string[] = [];
  private draggedIndex: number | null = null;
  private hoverIndex: number | null = null;

  static styles = css`
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      padding: 8px;
      margin: 4px 0;
      background-color: #f2f2f2;
      border: 1px solid #ddd;
      cursor: grab;
    }
    li.dragged {
      opacity: 0.5;
      cursor: grabbing;
    }

    li.placeholder {
      opacity: 0.3;
    }
    li.hidden {
      display: none;
    }
  `;

  constructor(private reader: RoaReader) {
    super();
  }

  render() {
    return html`
      <ul>
        ${repeat(
          this.reader.stages,
          (item) => item,
          (item, index) => html`
            <li
              draggable="true"
              @dragstart="${(e: DragEvent) => this.onDragStart(e, index)}"
              @dragover="${(e: DragEvent) => this.onDragOver(e, index)}"
              @drop="${(e: DragEvent) => this.onDrop(e, index)}"
              @dragend="${this.onDragEnd}"
              class=${classMap({
                dragged: this.draggedIndex === index,
                placeholder: this.hoverIndex === index,
              })}
            >
              ${item}
            </li>
          `,
        )}
      </ul>
    `;
  }

  private onDragStart(e: DragEvent, index: number) {
    this.draggedIndex = index;
    if (!e.dataTransfer) return;
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";

    const target = e.target as HTMLElement;
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    document.body.appendChild(clone);
    e.dataTransfer?.setDragImage(clone, 0, 0);

    this.requestUpdate();
  }

  private onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
    this.hoverIndex = index;
    this.requestUpdate();
  }

  private onDrop(e: DragEvent, newIndex: number) {
    e.preventDefault();
    const oldIndex = this.draggedIndex;
    if (oldIndex !== null && oldIndex !== newIndex) {
      /*
      const updatedItems = [...this.items];
      const [movedItem] = updatedItems.splice(oldIndex, 1);
      updatedItems.splice(newIndex, 0, movedItem);
      this.items = updatedItems;

      this.dispatchEvent(
        new CustomEvent('item-sorted', {
          detail: { oldIndex, newIndex },
          bubbles: true,
          composed: true,
        })
      );
    */
    }
    console.log("moved", oldIndex, newIndex);
    this.draggedIndex = null;
    this.hoverIndex = null;
  }

  private onDragEnd() {
    this.draggedIndex = null;
    this.hoverIndex = null;
    this.requestUpdate();
  }
}
