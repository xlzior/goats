import { Memory } from "./memory";
import { Tag } from "./tag";
import { add_ascii_tree } from "./utils";

export class MemoryObject {
  constructor(
    public name: string,
    public attributes?: Record<string, any>,
    public children?: number[],
  ) {}

  to_string(): string {
    const a = this.attributes
      ? Object.entries(this.attributes)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")
      : "";
    return `${this.name}(${a})`;
  }

  children_to_string(memory: Memory): string[] {
    if (!this.children) return [];

    return add_ascii_tree(
      this.children.map((child) => {
        const obj = memory.address_to_object(child);
        return `${format_address(child)} - ${obj.to_string()}`;
      }),
    );
  }
}

export function format_address(address: number): string {
  return `@${address}`.padStart(4, " ");
}

export const to_memory_object: Record<
  Tag,
  (address: number, memory: Memory) => MemoryObject
> = {
  [Tag.False]: function (address: number, memory: Memory) {
    return new MemoryObject("False");
  },
  [Tag.True]: function (address: number, memory: Memory) {
    return new MemoryObject("True");
  },
  [Tag.Undefined]: function (address: number, memory: Memory) {
    return new MemoryObject("Undefined");
  },
  [Tag.Number]: function (address: number, memory: Memory) {
    return new MemoryObject("Number", {
      value: memory.number.get(address),
    });
  },
  [Tag.String]: function (address: number, memory: Memory) {
    return new MemoryObject("String", {
      value: memory.string.get(address),
    });
  },
  [Tag.Blockframe]: function (address: number, memory: Memory) {
    const bf_env = memory.blockframe.get_environment(address);
    return new MemoryObject("Blockframe", {}, [bf_env]);
  },
  [Tag.Callframe]: function (address: number, memory: Memory) {
    const pc = memory.callframe.get_pc(address);
    const env = memory.callframe.get_environment(address);
    return new MemoryObject("Callframe", { pc }, [env]);
  },
  [Tag.Closure]: function (address: number, memory: Memory) {
    const arity = memory.closure.get_arity(address);
    const pc = memory.closure.get_pc(address);
    const env = memory.closure.get_environment(address);
    return new MemoryObject("Closure", { arity, pc }, [env]);
  },
  [Tag.EnvFrame]: function (address: number, memory: Memory) {
    const size = memory.frame.get_num_values(address);
    const values = new Array(size).fill(null).map((_, i) => {
      return memory.frame.get_value(address, i);
    });
    return new MemoryObject("EnvFrame", { size }, values);
  },
  [Tag.Environment]: function (address: number, memory: Memory) {
    const size = memory.environment.get_num_frames(address);
    const frames = new Array(size).fill(null).map((_, i) => {
      return memory.heap.get_child(address, i);
    });
    return new MemoryObject("Environment", { size }, frames);
  },
  [Tag.Builtin]: function (address: number, memory: Memory) {
    const id = memory.builtin.get_id(address);
    return new MemoryObject("Builtin", { id });
  },
  [Tag.Channel]: function (address: number, memory: Memory) {
    const value = memory.channel.get_value(address);
    return new MemoryObject("Channel", { value });
  },
  [Tag.BufferedChannel]: function (address: number, memory: Memory) {
    const size = memory.buffered_channel.get_size(address);
    const values = memory.buffered_channel.get_values(address);
    return new MemoryObject("BufferedChannel", { size }, values);
  },
  [Tag.Mutex]: function (address: number, memory: Memory) {
    const is_available = memory.mutex.is_available(address);
    return new MemoryObject("Mutex", { is_available });
  },
  [Tag.WaitGroup]: function (address: number, memory: Memory) {
    const value = memory.wait_group.get(address);
    return new MemoryObject("WaitGroup", { value });
  },
};
