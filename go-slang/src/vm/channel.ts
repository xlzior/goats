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
    this.memory.channel.set_is_receiver_waiting(this.addr, this.memory.False);
    return true;
  }

  dequeue() {
    const value = this.memory.channel.get_value(this.addr);
    if (value === this.memory.Undefined) {
      // signal receiver is waiting
      this.memory.channel.set_is_receiver_waiting(this.addr, this.memory.True);
    } else {
      // remove the value from the channel and remove signal
      this.memory.channel.set_value(this.addr, this.memory.Undefined);
      this.memory.channel.set_is_receiver_waiting(this.addr, this.memory.False);
    }
    return value; // Undefined if no value is available
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

  get isEmpty() {
    const first = this.memory.buffered_channel.get_slot(this.addr, this.head);
    return first === this.memory.Undefined;
  }

  get isFull() {
    return !this.isEmpty && this.head === this.tail;
  }

  enqueue(val: number) {
    if (this.isFull) {
      // enqueue fails if queue is full
      return false;
    }

    const size = this.size;

    if (this.isEmpty) {
      // reset the head and tail pointers to start at 0
      this.memory.buffered_channel.set_head(this.addr, 0);
      this.memory.buffered_channel.set_tail(this.addr, 1 % size);
      this.memory.buffered_channel.set_slot(this.addr, 0, val);
      return true;
    }

    const tail = this.tail;
    this.memory.buffered_channel.set_slot(this.addr, tail, val);
    this.memory.buffered_channel.set_tail(this.addr, (tail + 1) % size);
    return true;
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
