import { RuntimeError } from "../errors";
import { is_number, is_string } from "../utils";
import { BufferedChannel, Channel } from "./channel";
import { Heap } from "./heap";
import { MemoryObject, to_memory_object } from "./memory_display";
import { Tag } from "./tag";

export class Memory {
  heap: Heap;
  False: number;
  True: number;
  Undefined: number;
  string_pool: Map<number, string>; // <string address, actual string value>

  constructor(heap_size: number) {
    this.heap = new Heap(heap_size);
    this.False = this.heap.allocate(Tag.False, 1);
    this.True = this.heap.allocate(Tag.True, 1);
    this.Undefined = this.heap.allocate(Tag.Undefined, 1);
    this.string_pool = new Map();
  }

  address_to_object(address: number): MemoryObject {
    const tag = this.heap.get_tag(address) as Tag;
    const display_fn = to_memory_object[tag];
    if (!display_fn) {
      throw new Error(`No display function for tag ${tag}`);
    }
    return display_fn(address, this);
  }

  address_to_js_value(address: number) {
    switch (this.heap.get_tag(address)) {
      case Tag.False:
        return false;
      case Tag.True:
        return true;
      case Tag.Undefined:
        return undefined;
      case Tag.Number:
        return this.number.get(address);
      case Tag.Closure:
        return "<closure>";
      case Tag.Builtin:
        return "<builtin>";
      case Tag.String:
        return this.string.get(address);
      case Tag.Channel:
        return "<channel>";
      case Tag.BufferedChannel:
        return "<buffered_channel>";
      case Tag.Mutex:
        return "<Mutex>";
      case Tag.WaitGroup:
        return "<WaitGroup>";
      default:
        return "<internals>";
    }
  }

  js_value_to_address(value: any) {
    if (value === true) {
      return this.True;
    } else if (value === false) {
      return this.False;
    } else if (value === undefined) {
      return this.Undefined;
    } else if (is_number(value)) {
      return this.number.allocate(value);
    } else if (is_string(value)) {
      return this.string.allocate(value);
    }
    throw new RuntimeError(`Could not convert JS value ${value} to address`);
  }

  number = {
    allocate: (n: number) => {
      const number_address = this.heap.allocate(Tag.Number, 2);
      this.heap.set(number_address + 1, n);
      return number_address;
    },
    get: (address: number) => this.heap.get(address + 1),
  };

  string = {
    allocate: (new_string_val: string) => {
      for (const [existing_addr, existing_string_val] of this.string_pool) {
        if (existing_string_val === new_string_val) return existing_addr;
      }
      const string_address = this.heap.allocate(Tag.String, 1);
      this.string_pool.set(string_address, new_string_val);
      return string_address;
    },
    get: (address: number): string => {
      const string_val = this.string_pool.get(address);
      if (string_val === undefined)
        throw new RuntimeError("String value not found");
      return string_val;
    },
  };

  builtin = {
    allocate: (id: number) => {
      const address = this.heap.allocate(Tag.Builtin, 1);
      this.heap.set_byte_at_offset(address, 1, id);
      return address;
    },
    get_id: (address: number) => this.heap.get_byte_at_offset(address, 1),
  };

  closure = {
    allocate: (arity: number, pc: number, env: number) => {
      const address = this.heap.allocate(Tag.Closure, 2);
      this.heap.set_byte_at_offset(address, 1, arity);
      this.heap.set_2_bytes_at_offset(address, 2, pc);
      this.heap.set(address + 1, env);
      return address;
    },
    get_arity: (address: number) => this.heap.get_byte_at_offset(address, 1),
    get_pc: (address: number) => this.heap.get_2_bytes_at_offset(address, 2),
    get_environment: (address: number) => this.heap.get_child(address, 0),
  };

  blockframe = {
    allocate: (env: number) => {
      const address = this.heap.allocate(Tag.Blockframe, 2);
      this.heap.set(address + 1, env);
      return address;
    },
    get_environment: (address: number) => this.heap.get_child(address, 0),
  };

  callframe = {
    allocate: (env: number, pc: number) => {
      const address = this.heap.allocate(Tag.Callframe, 2);
      this.heap.set_2_bytes_at_offset(address, 2, pc);
      this.heap.set(address + 1, env);
      return address;
    },
    get_environment: (address: number) => this.heap.get_child(address, 0),
    get_pc: (address: number) => this.heap.get_2_bytes_at_offset(address, 2),
  };

  frame = {
    allocate: (num_values: number) => {
      return this.heap.allocate(Tag.Frame, num_values + 1);
    },
    get_num_values: (frame_address: number) => {
      return this.heap.get_size(frame_address) - 1;
    },
    get_value: (frame_address: number, index: number) => {
      return this.heap.get_child(frame_address, index);
    },
  };

  environment = {
    allocate: (num_frames: number) => {
      return this.heap.allocate(Tag.Environment, num_frames + 1);
    },
    get_num_frames: (env_address: number) => {
      return this.heap.get_size(env_address) - 1;
    },
    get_value: (env_address: number, position: [number, number]) => {
      const [frame_index, value_index] = position;
      const frame_address = this.heap.get_child(env_address, frame_index);
      return this.heap.get_child(frame_address, value_index);
    },
    set_value: (
      env_address: number,
      position: [number, number],
      value: any,
    ) => {
      const [frame_index, value_index] = position;
      const frame_address = this.heap.get_child(env_address, frame_index);
      this.heap.set_child(frame_address, value_index, value);
    },
    extend: (frame_address: number, env_address: number) => {
      const old_size = this.heap.get_size(env_address);
      const new_env_address = this.environment.allocate(old_size);
      let i;
      for (i = 0; i < old_size - 1; i++) {
        this.heap.set_child(
          new_env_address,
          i,
          this.heap.get_child(env_address, i),
        );
      }
      this.heap.set_child(new_env_address, i, frame_address);
      return new_env_address;
    },
  };

  address_to_channel(addr: number) {
    switch (this.heap.get_tag(addr)) {
      case Tag.Channel:
        return new Channel(this, addr);
      case Tag.BufferedChannel:
        return new BufferedChannel(this, addr);
      default:
        throw new RuntimeError("Invalid channel type");
    }
  }

  channel = {
    allocate: () => {
      const address = this.heap.allocate(Tag.Channel, 2);
      this.heap.set(address + 1, this.Undefined);
      return address;
    },
    set_value: (addr: number, val: number) => {
      this.heap.set_child(addr, 0, val);
    },
    get_value: (addr: number) => {
      return this.heap.get_child(addr, 0);
    },
    set_is_receiver_waiting: (addr: number, val: number) => {
      this.heap.set_byte_at_offset(addr, 1, val);
    },
    get_is_receiver_waiting: (addr: number) => {
      return this.heap.get_byte_at_offset(addr, 1);
    },
  };

  buffered_channel = {
    allocate: (size: number) => {
      const address = this.heap.allocate(Tag.BufferedChannel, size + 1);
      this.heap.set_byte_at_offset(address, 1, 0); // initialise head
      this.heap.set_byte_at_offset(address, 2, 0); // initialise tail
      for (let i = 0; i < size; i++) {
        // initialise all elements in the queue to be undefined
        this.heap.set_child(address, i, this.Undefined);
      }
      return address;
    },
    get_size: (addr: number) => {
      return this.heap.get_size(addr) - 1;
    },
    get_head: (addr: number) => {
      return this.heap.get_byte_at_offset(addr, 1);
    },
    set_head: (addr: number, val: number) => {
      this.heap.set_byte_at_offset(addr, 1, val);
    },
    get_tail: (addr: number) => {
      return this.heap.get_byte_at_offset(addr, 2);
    },
    set_tail: (addr: number, val: number) => {
      this.heap.set_byte_at_offset(addr, 2, val);
    },
    get_slot: (addr: number, i: number) => {
      return this.heap.get_child(addr, i);
    },
    set_slot: (addr: number, i: number, val: number) => {
      this.heap.set_child(addr, i, val);
    },
    get_values: (addr: number) => {
      const size = this.buffered_channel.get_size(addr);
      const head = this.buffered_channel.get_head(addr);
      const tail = this.buffered_channel.get_tail(addr);
      const values = [];
      for (let i = head; i !== tail; i = (i + 1) % size) {
        values.push(this.buffered_channel.get_slot(addr, i));
      }
      return values;
    },
  };

  mutex = {
    allocate: () => {
      const addr = this.heap.allocate(Tag.Mutex, 2);
      this.heap.set(addr + 1, 1); // default value is 1
      return addr;
    },
    is_available: (addr: number) => {
      return this.heap.get(addr + 1) === 1;
    },
    acquire: (addr: number) => {
      this.heap.set(addr + 1, 0);
    },
    release: (addr: number) => {
      this.heap.set(addr + 1, 1);
    },
  };

  wait_group = {
    allocate: () => {
      const addr = this.heap.allocate(Tag.WaitGroup, 2);
      this.heap.set(addr + 1, 0);
      return addr;
    },
    get: (addr: number) => {
      return this.heap.get(addr + 1);
    },
    update_counter: (addr: number, delta: number) => {
      const curr_count = this.heap.get(addr + 1);
      this.heap.set(addr + 1, curr_count + delta);
    },
    is_done: (addr: number) => {
      return this.heap.get(addr + 1) === 0;
    },
  };
}
