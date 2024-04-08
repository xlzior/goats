export class Config {
  constructor(
    public readonly memory: number = 10_000_000,
    public readonly debug_os: boolean = false,
  ) {}

  static from_args(args: Record<string, string>): Config {
    return new Config(
      parseInt(args.memory) || 10_000_000,
      args.debug_os === "true",
    );
  }
}
