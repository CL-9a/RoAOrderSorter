import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { main } from "../main";
import { Task } from "@lit/task";

@customElement("roa-list-grid-item")
export class RoaListGridItem extends LitElement {
  @property({ type: String }) path!: string;

  static styles = css`
    img {
      width: 56px;
      height: 40px;
      object-fit: cover;
    }
  `;

  private _productTask = new Task(this, {
    task: async ([path]) => main.dataStore.get(path),
    args: () => [this.path],
  });

  render() {
    return this._productTask.render({
      pending: () => html`<p>Loading</p>`,
      complete: (data) => {
        if (!data.isWS) {
          return html`<div title=${data.path}>local</div>`;
        }

        return html`
          <div title="${data.wsId}: ${data.data?.title || "<no data>"}">
            <img loading="lazy" src=${`${import.meta.env.BASE_URL}/wsdata/previewImages/${data.wsId}.png`}></img>
          </div>
        `;
      },
      error: (e) => html`<p>Error: ${e}</p>`,
    });
  }
}
