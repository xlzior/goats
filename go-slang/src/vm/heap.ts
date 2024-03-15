export enum Tag {
  False,
  True,
  Number,
  Nil,
  Blockframe,
  Callframe,
  Closure,
  Frame,
  Environment,
  Builtin,
}

export class Heap {
  word_size = 8;
  size_offset = 5;
  node_size = 10;
  free: number = 0;
  heap_size: number;

  view: DataView;

  constructor(heap_size: number) {
    this.heap_size = heap_size;
    const data = new ArrayBuffer(heap_size * this.word_size);
    this.view = new DataView(data);
  }

  allocate(tag: number, size: number): number {
    const address = this.free;
    this.free += size;
    this.view.setUint8(address * this.word_size, tag);
    this.view.setUint16(address * this.word_size + this.size_offset, size);
    return address;
  }

  get(address: number) {
    return this.view.getFloat64(address * this.word_size);
  }

  set(address: number, x: number) {
    this.view.setFloat64(address * this.word_size, x);
  }

  get_child(address: number, child_index: number) {
    return this.get(address + 1 + child_index);
  }

  set_child(address: number, child_index: number, value: any) {
    this.set(address + 1 + child_index, value);
  }

  get_tag(address: number) {
    return this.view.getUint8(address * this.word_size);
  }

  get_size(address: number) {
    return this.view.getUint16(address * this.word_size + this.size_offset);
  }

  get_number_of_children(address: number) {
    return this.get_tag(address) === Tag.Number
      ? 0
      : this.get_size(address) - 1;
  }

  set_byte_at_offset(address: number, offset: number, value: number) {
    this.view.setUint8(address * this.word_size + offset, value);
  }

  get_byte_at_offset(address: number, offset: number) {
    return this.view.getUint8(address * this.word_size + offset);
  }

  set_2_bytes_at_offset(address: number, offset: number, value: number) {
    this.view.setUint16(address * this.word_size + offset, value);
  }

  get_2_bytes_at_offset(address: number, offset: number) {
    return this.view.getUint16(address * this.word_size + offset);
  }

  set_4_bytes_at_offset(address: number, offset: number, value: number) {
    this.view.setUint32(address * this.word_size + offset, value);
  }

  get_4_bytes_at_offset(address: number, offset: number) {
    return this.view.getUint32(address * this.word_size + offset);
  }
}

export class Memory {
  heap: Heap;
  False: number;
  True: number;

  constructor(heap_size: number) {
    this.heap = new Heap(heap_size);
    this.False = this.heap.allocate(Tag.False, 1);
    this.True = this.heap.allocate(Tag.True, 1);
  }

  address_to_js_value(address: number) {
    switch (this.heap.get_tag(address)) {
      case Tag.False:
        return false;
      case Tag.True:
        return true;
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
    } else if (typeof value === "number") {
      return this.number.allocate(value);
    }
    return -1;
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
