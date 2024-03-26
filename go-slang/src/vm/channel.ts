import { Memory } from "./memory";

export class Channel {
  private memory: Memory;
  addr: number;

  constructor(memory: Memory, addr: number) {
    this.memory = memory;
    this.addr = addr;
  }

  enqueue(val: number) {
    if (
      this.memory.channel.get_is_receiver_waiting(this.addr) ===
      this.memory.False
    ) {
      // enqueue fails if there is no receiver waiting
      return false;
    }

    this.memory.channel.set_value(this.addr, val);
    return true;
  }

  dequeue() {
    const value = this.memory.channel.get_value(this.addr);
    if (value === this.memory.Undefined) {
      this.memory.channel.set_is_receiver_waiting(this.addr, this.memory.True);
    }
    // Undefined if no value is available
    return value;
  }
}

export class BufferedChannel {
  private memory: Memory;
  addr: number;

  constructor(memory: Memory, addr: number) {
    this.memory = memory;
    this.addr = addr;
  }

  get head() {
    return this.memory.buffered_channel.get_head(this.addr);
  }

  get tail() {
    return this.memory.buffered_channel.get_tail(this.addr);
  }

  get size() {
    return this.memory.buffered_channel.get_size(this.addr);
  }

  get isFull() {
    return this.head === this.tail;
  }

  get isEmpty() {
    return this.head === this.memory.Undefined;
  }

  enqueue(val: number) {
    if (this.isFull) {
      // enqueue fails if queue is full
      return false;
    }

    if (this.isEmpty) {
      // reset the head and tail pointers to start at 0
      this.memory.buffered_channel.set_head(this.addr, 0);
      this.memory.buffered_channel.set_tail(this.addr, 1);
      this.memory.buffered_channel.set_slot(this.addr, 0, val);
      return;
    }

    this.memory.buffered_channel.set_slot(this.addr, this.tail, val);
    const next_tail = (this.tail + 1) % this.size;
    this.memory.buffered_channel.set_tail(this.addr, next_tail);
  }

  dequeue() {
    if (this.isEmpty) {
      // dequeue returs Undefined if queue is empty
      return this.memory.Undefined;
    }

    const item = this.memory.buffered_channel.get_slot(this.addr, this.head);

    // remove the item from the queue
    this.memory.buffered_channel.set_slot(
      this.addr,
      this.head,
      this.memory.Undefined,
    );

    // increment the head pointer to the next item in the queue
    this.memory.buffered_channel.set_head(
      this.addr,
      (this.head + 1) % this.size,
    );

    return item;
  }
}
