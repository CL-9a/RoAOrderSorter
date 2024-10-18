import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import "./drop-zone.ts";
import "./roa-list-grid.ts";
import { main } from "../main.ts";
import { repeat } from "lit/directives/repeat.js";

@customElement("roa-saved-list")
export class RoaSavedList extends LitElement {
  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
  `;

  @property({ type: String }) type!: "stages" | "characters";

  @state()
  private savedLists: string[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.init();
  }

  private async init() {
    this.savedLists = await main.getSavedLists(this.type);
  }

  render() {
    return html`
      <span>Saved ${this.type} lists</div>
      <ul>
        ${repeat(this.savedLists, (name) => {
          return html` <li>
            ${name}
            <button @click=${() => this.loadList(name)}>Load</button>
            <button @click=${() => this.deleteList(name)}>Delete</button>
          </li>`;
        })}
        <li>
          <button @click=${this.storeList}>Store current list</button>
        </li>
      </ul>
    `;
  }

  private async loadList(name: string) {
    if (await main.loadSavedList(this.type, name)) {
      this.onChange();
    }
  }

  private async deleteList(name: string) {
    await main.delSavedList(this.type, name);
    this.onChange();
  }

  private storeList() {
    if (main.reader[this.type].length === 0) return;

    const name = prompt("Name for the list:");
    if (!name) return;

    main.storeCurrentList(this.type, name);
    this.onChange();
  }

  private async onChange() {
    await this.init();
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent("change"));
  }
}
