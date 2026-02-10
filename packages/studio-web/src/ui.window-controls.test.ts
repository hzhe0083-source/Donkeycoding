import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type TauriInternalsMock = {
  invoke: ReturnType<typeof vi.fn>;
  metadata: {
    currentWindow: {
      label: string;
    };
  };
};

let tauriInternals: TauriInternalsMock;

function enableTauriRuntime(): void {
  (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = tauriInternals;
}

function disableTauriRuntime(): void {
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
}

async function loadUiAndRender(): Promise<void> {
  const ui = await import("./ui");
  ui.render();
}

async function flushTasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitUntil(
  predicate: () => boolean,
  timeoutMs = 1000,
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return;
    }
    await flushTasks();
  }
  throw new Error("Timed out waiting for condition");
}

function commands(): string[] {
  return tauriInternals.invoke.mock.calls.map(([cmd]) => String(cmd));
}

describe("window controls", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    document.body.innerHTML = `<div id="app"></div>`;
    window.localStorage.clear();
    disableTauriRuntime();

    tauriInternals = {
      invoke: vi.fn().mockResolvedValue(undefined),
      metadata: {
        currentWindow: {
          label: "main",
        },
      },
    };
  });

  afterEach(async () => {
    await flushTasks();
  });

  it("click minimize triggers tauri minimize", async () => {
    enableTauriRuntime();
    await loadUiAndRender();

    const button = document.querySelector<HTMLButtonElement>("#btn-window-minimize");
    expect(button).toBeTruthy();

    button?.click();
    await waitUntil(() => commands().includes("plugin:window|minimize"));

    expect(commands()).toContain("plugin:window|minimize");
    expect(commands()).not.toContain("plugin:window|close");
  });

  it("click toggle maximize first maximize then unmaximize", async () => {
    let maximized = false;
    tauriInternals.invoke.mockImplementation(async (cmd: string) => {
      if (cmd === "plugin:window|is_maximized") {
        const current = maximized;
        maximized = !maximized;
        return current;
      }
      return undefined;
    });

    enableTauriRuntime();
    await loadUiAndRender();

    const button = document.querySelector<HTMLButtonElement>("#btn-window-toggle-maximize");
    expect(button).toBeTruthy();

    button?.click();
    await waitUntil(() => commands().includes("plugin:window|maximize"));

    button?.click();
    await waitUntil(() => commands().includes("plugin:window|unmaximize"));

    expect(commands().filter((command) => command === "plugin:window|is_maximized")).toHaveLength(2);
    expect(commands()).toContain("plugin:window|maximize");
    expect(commands()).toContain("plugin:window|unmaximize");
  });

  it("click close triggers tauri close", async () => {
    enableTauriRuntime();
    await loadUiAndRender();

    const button = document.querySelector<HTMLButtonElement>("#btn-window-close");
    expect(button).toBeTruthy();

    button?.click();
    await waitUntil(() => commands().includes("plugin:window|close"));

    expect(commands()).toContain("plugin:window|close");
    expect(commands()).not.toContain("plugin:window|minimize");
  });

  it("hides window controls outside tauri runtime", async () => {
    await loadUiAndRender();

    expect(document.querySelector("#btn-window-minimize")).toBeNull();
    expect(document.querySelector("#btn-window-toggle-maximize")).toBeNull();
    expect(document.querySelector("#btn-window-close")).toBeNull();
  });
});
