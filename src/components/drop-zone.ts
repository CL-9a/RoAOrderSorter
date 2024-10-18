import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
// @ts-expect-error TS7016 Could not find a declaration file for module '@placemarkio/flat-drop-files'.
import { getFilesFromDataTransferItems } from "@placemarkio/flat-drop-files";

@customElement("drop-zone")
export class DropZone extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 400px;
      height: 100px;
      border: 2px dashed #0087F7;
      border-radius: 10px;
      background-color: #F9F9F9;
      text-align: center;
      line-height: 100px;
      font-size: 16px;
      color: #333;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

   :host:hover {
      background-color: #f1f1f1;
    }

    :host.dragover {
      background-color: #E3F7FF;
      border-color: #00A5FF;
    }

    :host.dragover::before {
      content: "Drop here";
      color: #00A5FF;
      font-weight: bold;
    }
  `;

  render() {
    return html`<zone
      @dragenter=${(e: DragEvent) => e.preventDefault()}
      @dragover=${(e: DragEvent) => e.preventDefault()}
      @dragend=${(e: DragEvent) => e.preventDefault()}
      @drop=${(e: DragEvent) => {
        e.preventDefault();

        getFilesFromDataTransferItems(e.dataTransfer!.items).then(
          (files: File[]) => {
            if (files.length === 0)
              alert(
                "Received drop event but no files. Try using the filepicker instead (click the button).",
              );
            this.dispatchEvent(
              new CustomEvent("filesDropped", {
                detail: { files },
                bubbles: true,
                composed: true,
              }),
            );
          },
        );
      }}
      ><slot></slot
    ></zone>`;
  }
}
