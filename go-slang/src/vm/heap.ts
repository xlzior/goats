import { Tag } from "./tag";

const WORD_SIZE = 8;
const SIZE_OFFSET = 5;
const NODE_SIZE = 10;

export class Heap {
  free: number = 0;
  heap_size: number;
  view: DataView;

  constructor(heap_size: number) {
    this.heap_size = heap_size;
    const data = new ArrayBuffer(heap_size * WORD_SIZE);
    this.view = new DataView(data);
  }

  allocate(tag: Tag, size: number): number {
    const address = this.free;
    this.free += size;
    this.view.setUint8(address * WORD_SIZE, tag);
    this.view.setUint16(address * WORD_SIZE + SIZE_OFFSET, size);
    return address;
  }

  get(address: number) {
    return this.view.getFloat64(address * WORD_SIZE);
  }

  set(address: number, x: number) {
    this.view.setFloat64(address * WORD_SIZE, x);
  }

  get_child(address: number, child_index: number) {
    return this.get(address + 1 + child_index);
  }

  set_child(address: number, child_index: number, value: any) {
    this.set(address + 1 + child_index, value);
  }

  get_tag(address: number) {
    return this.view.getUint8(address * WORD_SIZE);
  }

  get_size(address: number) {
    return this.view.getUint16(address * WORD_SIZE + SIZE_OFFSET);
  }

  get_number_of_children(address: number) {
    return this.get_tag(address) === Tag.Number
      ? 0
      : this.get_size(address) - 1;
  }

  set_byte_at_offset(address: number, offset: number, value: number) {
    this.view.setUint8(address * WORD_SIZE + offset, value);
  }

  get_byte_at_offset(address: number, offset: number) {
    return this.view.getUint8(address * WORD_SIZE + offset);
  }

  set_2_bytes_at_offset(address: number, offset: number, value: number) {
    this.view.setUint16(address * WORD_SIZE + offset, value);
  }

  get_2_bytes_at_offset(address: number, offset: number) {
    return this.view.getUint16(address * WORD_SIZE + offset);
  }

  set_4_bytes_at_offset(address: number, offset: number, value: number) {
    this.view.setUint32(address * WORD_SIZE + offset, value);
  }

  get_4_bytes_at_offset(address: number, offset: number) {
    return this.view.getUint32(address * WORD_SIZE + offset);
  }
}
