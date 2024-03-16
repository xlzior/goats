import { Heap } from "./heap";
import { Tag } from "./tag";
import {
  is_string,
  is_number
} from "../utils"

export class Memory {
  heap: Heap;
  False: number;
  True: number;
  // TODO: go does not have undefined
  Undefined: number;

  constructor(heap_size: number) {
    this.heap = new Heap(heap_size);
    this.False = this.heap.allocate(Tag.False, 1);
    this.True = this.heap.allocate(Tag.True, 1);
    this.Undefined = this.heap.allocate(Tag.Undefined, 1);
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
        return this.heap.get(address + 1);
      case Tag.Closure:
        return "<closure>";
      case Tag.Builtin:
        return "<builtin>";
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
    }
    throw new Error(`Could not convert JS value ${value} to address`);
  }

  number = {
    allocate: (n: number) => {
      const number_address = this.heap.allocate(Tag.Number, 2);
      this.heap.set(number_address + 1, n);
      return number_address;
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
  };

  environment = {
    allocate: (num_frames: number) => {
      return this.heap.allocate(Tag.Environment, num_frames + 1);
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
}
