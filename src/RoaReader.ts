const d = new TextDecoder();
const e = new TextEncoder();

function encodeLE(number: number) {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setUint16(0, number, true); // true indicates Little Endian
  return new Uint8Array(buffer);
}

function encodeStrings(strings: string[]) {
  let bytes = [];
  for (const string of strings) {
    const encodedString = e.encode(string);
    bytes.push(...encodedString, 0x00);
  }

  return new Uint8Array(bytes);
}

//const header = [0x6f, 0x72, 0x64, 0x65, 0x72, 0x2e, 0x72, 0x6f, 0x61];
const header = e.encode("order.roa");

const readUpToNull = (buffer: Uint8Array, startIndex: number) => {
  for (let i = startIndex; i < buffer.length; i++) {
    if (buffer[i] === 0x00) {
      const str = d.decode(buffer.slice(startIndex, i));
      return { next: i, string: str };
    }
  }
};

export class RoaReader {
  characters: string[] = [];
  buddies: string[] = [];
  stages: string[] = [];
  skins: string[] = [];

  constructor() {}

  async loadFile(from: ArrayBuffer) {
    const view = new Uint8Array(from);
    const groups = [];
    let currGroup = [];

    let expectedCount = 0;
    let i = 0;
    while (i < view.length - 1) {
      const res = readUpToNull(view, i);
      if (res == undefined) {
        // The loop should stop first so this shouldn't happen
        console.warn("stopping", res, i, view.length);
        break;
      }

      i = res.next;
      if (res.string === "order.roa") {
        if (currGroup.length !== expectedCount) {
          console.warn(
            `Expected ${expectedCount} but got ${currGroup.length} elems!`,
          );
        }
        groups.push(currGroup);
        currGroup = [];

        let _expectedCount = RoaReader.readPreamble(view, i);
        if (!_expectedCount) {
          throw new Error("Parse error (expected preamble after order.roa)");
        }
        expectedCount = _expectedCount;
        i += 6;
      } else {
        currGroup.push(res.string);
        i += 1;
      }
    }

    if (currGroup.length !== expectedCount) {
      console.warn(
        `Expected ${expectedCount} but got ${currGroup.length} elems!`,
      );
    }
    groups.push(currGroup);

    // Need this because my parsing game is weak.
    // Since the loop encounters the "order.roa" header first thing first, it immediately creates a new currGroup and adds the initial empty one to groups
    groups.shift();

    if (groups.length < 4) {
      throw new Error(
        `Parse error (expected >= 4 groups but got ${groups.length})`,
      );
    }

    this.characters = groups[0];
    this.buddies = groups[1];
    this.stages = groups[2];
    this.skins = groups[3];
  }

  static readPreamble(view: Uint8Array, i: number) {
    if (
      view[i] == 0x00 &&
      view[i + 1] === 0x01 &&
      view[i + 4] === 0x00 &&
      view[i + 5] === 0x00
    ) {
      return view[i + 2] | (view[i + 3] << 8);
    }

    return false;
  }

  static checkFile(file: ArrayBuffer): boolean {
    return d.decode(file.slice(0, 9)) === "order.roa";
  }

  private getGroupFromName(groupName: "stages" | "characters") {
    if (groupName === "stages") {
      return this.stages;
    }
    if (groupName === "characters") {
      return this.characters;
    }

    throw new Error("unknown group");
  }

  switchElems(
    groupName: "stages" | "characters",
    index1: number,
    index2: number,
  ) {
    const group = this.getGroupFromName(groupName);
    [group[index1], group[index2]] = [group[index2], group[index1]];
  }

  addElem(groupName: "stages" | "characters", index: number, elem: string) {
    const group = this.getGroupFromName(groupName);
    group.splice(index, 0, elem);
  }

  removeElem(groupName: "stages" | "characters", index: number) {
    const group = this.getGroupFromName(groupName);
    return group.splice(index, 1)[0];
  }

  writeFile() {
    const blobParts = [];

    for (const group of [
      this.characters,
      this.buddies,
      this.stages,
      this.skins,
    ]) {
      blobParts.push(header);
      blobParts.push(new Uint8Array([0x00, 0x01]));
      blobParts.push(encodeLE(group.length));
      blobParts.push(new Uint8Array([0x00, 0x00]));
      blobParts.push(encodeStrings(group));
    }

    return new Blob(blobParts);
  }
}

async function blobsAreEqual(blob1: Blob, blob2: Blob) {
  if (blob1.size !== blob2.size) {
    return false;
  }

  const [buffer1, buffer2] = await Promise.all([
    blob1.arrayBuffer(),
    blob2.arrayBuffer(),
  ]);

  const view1 = new Uint8Array(buffer1);
  const view2 = new Uint8Array(buffer2);

  for (let i = 0; i < view1.length; i++) {
    if (view1[i] !== view2[i]) {
      return false;
    }
  }

  return true;
}
