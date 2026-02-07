import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";

export type JsonRpcNotification = {
  method: string;
  params?: unknown;
};

type OrchestratorClientOptions = {
  onNotification?: (notification: JsonRpcNotification) => void;
  onStderr?: (message: string) => void;
  onExit?: (code: number | null) => void;
};

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export class OrchestratorClient {
  private process: ChildProcessWithoutNullStreams;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private buffer = Buffer.alloc(0);
  private options: OrchestratorClientOptions;

  constructor(command: string, args: string[], options: OrchestratorClientOptions = {}) {
    this.options = options;
    this.process = spawn(command, args, { stdio: "pipe" });

    this.process.stdout.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk] as readonly Uint8Array[]);
      this.drainBuffer();
    });

    this.process.stderr.on("data", (chunk: Buffer) => {
      const message = chunk.toString("utf8");
      this.options.onStderr?.(message);
      console.error(`[workerflow orchestrator stderr] ${message}`);
    });

    this.process.on("exit", (code) => {
      this.options.onExit?.(code);
      const error = new Error(`orchestrator exited with code ${code ?? "unknown"}`);
      for (const request of this.pending.values()) {
        request.reject(error);
      }
      this.pending.clear();
    });
  }

  public async request(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    const payload = Buffer.from(JSON.stringify(request), "utf8");
    const header = Buffer.from(`Content-Length: ${payload.length}\r\n\r\n`, "utf8");

    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.process.stdin.write(header);
    this.process.stdin.write(payload);

    return promise;
  }

  public dispose(): void {
    this.process.kill();
  }

  private drainBuffer(): void {
    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) {
        return;
      }

      const headerText = this.buffer.subarray(0, headerEnd).toString("utf8");
      const contentLengthLine = headerText
        .split("\r\n")
        .find((line) => line.toLowerCase().startsWith("content-length:"));

      if (!contentLengthLine) {
        this.buffer = this.buffer.subarray(headerEnd + 4) as Buffer;
        continue;
      }

      const contentLength = Number(contentLengthLine.split(":")[1].trim());
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (this.buffer.length < messageEnd) {
        return;
      }

      const messageText = this.buffer.subarray(messageStart, messageEnd).toString("utf8");
      this.buffer = this.buffer.subarray(messageEnd) as Buffer;

      let message: {
        id?: number;
        result?: unknown;
        error?: { code: number; message: string };
        method?: string;
        params?: unknown;
      };

      try {
        message = JSON.parse(messageText) as {
          id?: number;
          result?: unknown;
          error?: { code: number; message: string };
          method?: string;
          params?: unknown;
        };
      } catch {
        continue;
      }

      if (typeof message.id === "number") {
        const pending = this.pending.get(message.id);
        if (!pending) {
          continue;
        }
        this.pending.delete(message.id);

        if (message.error) {
          pending.reject(new Error(`${message.error.code}: ${message.error.message}`));
        } else {
          pending.resolve(message.result);
        }
        continue;
      }

      if (message.method) {
        this.options.onNotification?.({
          method: message.method,
          params: message.params,
        });
        console.log(`[workerflow notification] ${message.method}`, message.params ?? {});
      }
    }
  }
}
