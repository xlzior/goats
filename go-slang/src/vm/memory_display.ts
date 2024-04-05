import { Memory } from "./memory";
import { Tag } from "./tag";
import { add_ascii_tree } from "./utils";

export const display_functions: Record<
  Tag,
  (address: number, memory: Memory) => string[]
> = {
  [Tag.False]: function (address: number, memory: Memory): string[] {
    return ["false"];
  },
  [Tag.True]: function (address: number, memory: Memory): string[] {
    return ["true"];
  },
  [Tag.Undefined]: function (address: number, memory: Memory): string[] {
    return ["undefined"];
  },
  [Tag.Number]: function (address: number, memory: Memory): string[] {
    return [memory.number.get(address).toString()];
  },
  [Tag.String]: function (address: number, memory: Memory): string[] {
    return [memory.string.get(address)];
  },
  [Tag.Blockframe]: function (address: number, memory: Memory): string[] {
    const bf_env = memory.blockframe.get_environment(address);
    return [`Blockframe()`, ...add_ascii_tree([`Environment@${bf_env}`])];
  },
  [Tag.Callframe]: function (address: number, memory: Memory): string[] {
    const pc = memory.callframe.get_pc(address);
    const cf_env = memory.callframe.get_environment(address);
    return [
      `Callframe(pc=${pc})`,
      ...add_ascii_tree([`Environment@${cf_env}`]),
    ];
  },
  [Tag.Closure]: function (address: number, memory: Memory): string[] {
    const arity = memory.closure.get_arity(address);
    const closure_pc = memory.closure.get_pc(address);
    const c_env = memory.closure.get_environment(address);
    return [
      `Closure(arity=${arity}, pc=${closure_pc})`,
      ...add_ascii_tree([`Environment@${c_env}`]),
    ];
  },
  [Tag.Frame]: function (address: number, memory: Memory): string[] {
    const num_values = memory.frame.get_num_values(address);
    const values = new Array(num_values).fill(null).map((_, i) => {
      const value_address = memory.frame.get_value(address, i);
      const value_display = memory.address_to_display_values(value_address);
      return `@${value_address} - ${value_display[0]}`;
    });
    return [`Frame(size=${num_values})`, ...add_ascii_tree(values)];
  },
  [Tag.Environment]: function (address: number, memory: Memory): string[] {
    const num_frames = memory.environment.get_num_frames(address);
    const frames = new Array(num_frames).fill(null).map((_, i) => {
      const frame_address = memory.heap.get_child(address, i);
      return `Frame@${frame_address}`;
    });
    return [`Environment(size=${num_frames})`, ...add_ascii_tree(frames)];
  },
  [Tag.Builtin]: function (address: number, memory: Memory): string[] {
    return [`Builtin#${memory.builtin.get_id(address)}`];
  },
  [Tag.Channel]: function (address: number, memory: Memory): string[] {
    return [`Channel(value=${memory.channel.get_value(address)})`];
  },
  [Tag.BufferedChannel]: function (address: number, memory: Memory): string[] {
    return [
      `BufferedChannel(size=${memory.buffered_channel.get_size(address)})`,
    ];
  },
  [Tag.Mutex]: function (address: number, memory: Memory): string[] {
    return [
      `Mutex(${memory.mutex.is_available(address) ? "available" : "locked"})`,
    ];
  },
  [Tag.WaitGroup]: function (address: number, memory: Memory): string[] {
    const wait_group_value = memory.wait_group.get(address);
    return [`WaitGroup(value=${wait_group_value})`];
  },
};
