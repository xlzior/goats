import { RuntimeError } from "../errors";
import { Tag } from "./tag";

const WORD_SIZE = 8;
const SIZE_OFFSET = 5;
export const NODE_SIZE = 10;

const MARKBIT = 7;
const UNMARKED = 0;
const MARKED = 1;

export class Heap {
  free: number = 0;
  heap_size: number;
  view: DataView;
  bottom: number = 0;
  get_roots: () => number[];

  constructor(heap_size: number, get_roots: () => number[]) {
    this.heap_size = heap_size;
    this.get_roots = get_roots;
    const data = new ArrayBuffer(heap_size * WORD_SIZE);
    this.view = new DataView(data);

    // initialise free list to be a chain of all nodes
    let i = 0;
    for (i = 0; i <= heap_size - NODE_SIZE; i += NODE_SIZE) {
      this.set(i, i + NODE_SIZE);
    }
    this.set(i - NODE_SIZE, -1);
  }

  set_bottom() {
    this.bottom = this.free;
  }

  allocate(tag: Tag, size: number): number {
    if (size > NODE_SIZE)
      throw new RuntimeError("Node size cannot be larger than 10 words");

    if (this.free === -1) {
      // console.log("Garbage collection triggered while trying to allocate", tag);
      this.mark_sweep();
    }

    const address = this.free;
    this.free = this.get(this.free);
    this.view.setUint8(address * WORD_SIZE, tag);
    this.view.setUint16(address * WORD_SIZE + SIZE_OFFSET, size);
    return address;
  }

  mark_sweep() {
    const roots = this.get_roots();
    roots.forEach((root) => this.mark(root));
    this.sweep();
    if (this.free === -1) throw new RuntimeError("Heap is full");
  }

  mark(address: number) {
    if (this.is_unmarked(address)) {
      // console.log("Marking", address);
      this.set_mark(address, MARKED);
      const number_of_children = this.get_number_of_children(address);
      for (let i = 0; i < number_of_children; i++) {
        this.mark(this.get_child(address, i));
      }
    }
  }

  sweep() {
    for (let i = this.bottom; i < this.heap_size; i += NODE_SIZE) {
      if (this.is_unmarked(i)) {
        // console.log("Freeing", i);
        this.set(i, this.free);
        this.free = i;
      } else {
        this.set_mark(i, UNMARKED);
      }
    }
  }

  is_unmarked(address: number) {
    return this.get_byte_at_offset(address, MARKBIT) === UNMARKED;
  }

  set_mark(address: number, mark: number) {
    this.set_byte_at_offset(address, MARKBIT, mark);
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
