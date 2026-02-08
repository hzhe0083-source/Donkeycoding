import { listen } from "@tauri-apps/api/event";
import { handleNotification } from "./notifications";
import { refreshOrchestratorStatus } from "./rpc";
import { guideFlow, loadSettings, pushLog, pushNotification, state } from "./state";
import type { NotificationEnvelope, NotificationMethod } from "./types";
import { mountStyles, patchDiscussionStream, render } from "./ui";

async function bootstrap(): Promise<void> {
  loadSettings();
  mountStyles();
  render();

  await listen<NotificationEnvelope>("orchestrator-notification", (event) => {
    if (event.payload.method) {
      pushLog(`[notify] ${String(event.payload.method)}`);
    }

    if (event.payload.method) {
      const method = event.payload.method as NotificationMethod | string;
      if (
        method === "turn/chunk" ||
        method === "turn/complete" ||
        method === "session/progress" ||
        method === "session/state" ||
        method === "session/participants" ||
        method === "workflow/step" ||
        method === "workflow/complete"
      ) {
        handleNotification(event.payload);
        if (method === "turn/chunk" && state.workspaceMode === "offices" && !guideFlow.open) {
          patchDiscussionStream();
        } else {
          render();
        }
        return;
      }
    }
    pushNotification("unknown", event.payload);
    render();
  });

  await listen<string>("orchestrator-log", (event) => {
    pushLog(`[orchestrator] ${event.payload}`);
    render();
  });

  await listen("orchestrator-exit", () => {
    state.orchestratorRunning = false;
    if (state.runStatus !== "error") {
      state.runStatus = "stopped";
    }
    pushLog("orchestrator process exited");
    render();
  });

  await refreshOrchestratorStatus();
  render();
}

void bootstrap();
