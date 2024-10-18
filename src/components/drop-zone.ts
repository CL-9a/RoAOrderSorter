import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
// @ts-expect-error TS7016 Could not find a declaration file for module '@placemarkio/flat-drop-files'.
import { getFilesFromDataTransferItems } from "@placemarkio/flat-drop-files";

@customElement("drop-zone")
export class DropZone extends LitElement {
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
