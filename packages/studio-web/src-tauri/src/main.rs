#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::Mutex;

// ─── 全局状态 ──────────────────────────────────────────────────────

struct OrchestratorState {
    child: Option<Child>,
    stdin: Option<ChildStdin>,
    next_id: AtomicU64,
    /// 存储 pending 请求的 oneshot sender
    pending: tokio::sync::Mutex<
        std::collections::HashMap<u64, tokio::sync::oneshot::Sender<Result<Value, String>>>,
    >,
}

impl Default for OrchestratorState {
    fn default() -> Self {
        Self {
            child: None,
            stdin: None,
            next_id: AtomicU64::new(1),
            pending: tokio::sync::Mutex::new(std::collections::HashMap::new()),
        }
    }
}

type SharedState = Mutex<OrchestratorState>;

// ─── 辅助：查找 orchestrator 可执行文件 ──────────────────────────

fn find_orchestrator_exe() -> Option<PathBuf> {
    if let Ok(path) = std::env::var("ORCHESTRATOR_BIN") {
        let p = PathBuf::from(path);
        if p.exists() {
            return Some(p);
        }
    }

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    for ancestor in manifest_dir.ancestors() {
        let candidate = ancestor.join("target").join("debug").join("orchestrator.exe");
        if candidate.exists() {
            return Some(candidate);
        }
        let candidate = ancestor.join("target").join("debug").join("orchestrator");
        if candidate.exists() {
            return Some(candidate);
        }

        let candidate = ancestor.join("target").join("release").join("orchestrator.exe");
        if candidate.exists() {
            return Some(candidate);
        }
        let candidate = ancestor.join("target").join("release").join("orchestrator");
        if candidate.exists() {
            return Some(candidate);
        }
    }

    // 优先查找与当前 exe 同目录
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(dir) = current_exe.parent() {
            let candidate = dir.join("orchestrator.exe");
            if candidate.exists() {
                return Some(candidate);
            }
            let candidate = dir.join("orchestrator");
            if candidate.exists() {
                return Some(candidate);
            }
        }
    }

    // 查找 repo 根目录的 target/debug
    if let Ok(cwd) = std::env::current_dir() {
        for ancestor in cwd.ancestors() {
            let candidate = ancestor.join("target").join("debug").join("orchestrator.exe");
            if candidate.exists() {
                return Some(candidate);
            }
            let candidate = ancestor.join("target").join("debug").join("orchestrator");
            if candidate.exists() {
                return Some(candidate);
            }
            // 检查是否有 Cargo.toml（repo root 标志）
            if ancestor.join("Cargo.toml").exists() {
                break;
            }
        }
    }

    // 环境变量覆盖
    None
}

// ─── JSON-RPC 写入辅助 ──────────────────────────────────────────

async fn write_rpc_message(stdin: &mut ChildStdin, payload: &[u8]) -> Result<(), String> {
    let header = format!("Content-Length: {}\r\n\r\n", payload.len());
    stdin
        .write_all(header.as_bytes())
        .await
        .map_err(|e| format!("Failed to write header: {e}"))?;
    stdin
        .write_all(payload)
        .await
        .map_err(|e| format!("Failed to write body: {e}"))?;
    stdin
        .flush()
        .await
        .map_err(|e| format!("Failed to flush: {e}"))?;
    Ok(())
}

// ─── Tauri Commands ──────────────────────────────────────────────

#[derive(Serialize, Deserialize)]
struct RpcResult {
    success: bool,
    data: Value,
    error: Option<String>,
}

/// 启动 orchestrator 子进程
#[tauri::command]
async fn start_orchestrator(
    app: AppHandle,
    state: State<'_, SharedState>,
) -> Result<RpcResult, String> {
    let mut guard = state.lock().await;

    // 如果已经在运行，先停止
    if let Some(ref mut child) = guard.child {
        let _ = child.kill().await;
    }

    let exe_path = find_orchestrator_exe().ok_or_else(|| {
        "orchestrator binary not found. Run 'cargo build -p orchestrator' first.".to_string()
    })?;

    eprintln!("[studio] Starting orchestrator: {:?}", exe_path);

    let mut child = Command::new(&exe_path)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn orchestrator: {e}"))?;

    let stdin = child.stdin.take().ok_or("Failed to get stdin")?;
    let stdout = child.stdout.take().ok_or("Failed to get stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to get stderr")?;

    guard.child = Some(child);
    guard.stdin = Some(stdin);

    // 启动 stdout 读取任务（解析 JSON-RPC 响应和通知）
    let app_handle = app.clone();
    let _state_for_stdout: tauri::State<'_, SharedState> = app.state();
    let _pending_ref = {
        // 我们需要一个 Arc 来共享 pending map
        // 但 State 已经是 Arc-like，所以我们用另一种方式
        // 直接在 spawn 中通过 app.state() 访问
        ()
    };

    // 用 Arc 包装 pending map 以便在 spawn 中使用
    // 由于 Tauri State 不能直接 move 到 spawn，我们用 app_handle
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout);
        let mut buffer = Vec::new();

        loop {
            // 读取 headers
            let mut header_buf = String::new();
            let mut content_length: Option<usize> = None;

            loop {
                header_buf.clear();
                match reader.read_line(&mut header_buf).await {
                    Ok(0) => {
                        eprintln!("[studio] orchestrator stdout closed");
                        let _ = app_handle.emit("orchestrator-exit", ());
                        return;
                    }
                    Ok(_) => {}
                    Err(e) => {
                        eprintln!("[studio] stdout read error: {e}");
                        let _ = app_handle.emit("orchestrator-exit", ());
                        return;
                    }
                }

                let trimmed = header_buf.trim();
                if trimmed.is_empty() {
                    break;
                }
                if let Some((key, value)) = trimmed.split_once(':') {
                    if key.eq_ignore_ascii_case("Content-Length") {
                        content_length = value.trim().parse().ok();
                    }
                }
            }

            let Some(len) = content_length else {
                continue;
            };

            // 读取 body
            buffer.resize(len, 0);
            if let Err(e) = reader.read_exact(&mut buffer).await {
                eprintln!("[studio] stdout body read error: {e}");
                continue;
            }

            let message: Value = match serde_json::from_slice(&buffer) {
                Ok(v) => v,
                Err(e) => {
                    eprintln!("[studio] JSON parse error: {e}");
                    continue;
                }
            };

            // 判断是响应还是通知
            if let Some(id) = message.get("id").and_then(|v| v.as_u64()) {
                // 这是一个响应，找到对应的 pending sender
                let state: State<'_, SharedState> = app_handle.state();
                let guard = state.lock().await;
                let mut pending = guard.pending.lock().await;
                if let Some(sender) = pending.remove(&id) {
                    if let Some(error) = message.get("error") {
                        let msg = error
                            .get("message")
                            .and_then(|m| m.as_str())
                            .unwrap_or("unknown error");
                        let _ = sender.send(Err(msg.to_string()));
                    } else {
                        let result = message.get("result").cloned().unwrap_or(Value::Null);
                        let _ = sender.send(Ok(result));
                    }
                }
            } else if let Some(_method) = message.get("method").and_then(|m| m.as_str()) {
                // 这是一个通知，转发给前端
                let _ = app_handle.emit("orchestrator-notification", &message);
            }
        }
    });

    // 启动 stderr 读取任务
    let app_handle2 = app.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr);
        let mut line = String::new();
        loop {
            line.clear();
            match reader.read_line(&mut line).await {
                Ok(0) => break,
                Ok(_) => {
                    let trimmed = line.trim().to_string();
                    if !trimmed.is_empty() {
                        eprintln!("[orchestrator] {trimmed}");
                        let _ = app_handle2.emit("orchestrator-log", &trimmed);
                    }
                }
                Err(_) => break,
            }
        }
    });

    Ok(RpcResult {
        success: true,
        data: serde_json::json!({ "status": "started", "exe": exe_path.to_string_lossy() }),
        error: None,
    })
}

/// 发送 JSON-RPC 请求到 orchestrator
#[tauri::command]
async fn send_rpc(
    state: State<'_, SharedState>,
    method: String,
    params: Option<Value>,
) -> Result<Value, String> {
    let mut guard = state.lock().await;

    // 先获取 id（不可变借用），再获取 stdin（可变借用），避免借用冲突
    let id = guard.next_id.fetch_add(1, Ordering::SeqCst);

    let stdin = guard
        .stdin
        .as_mut()
        .ok_or("Orchestrator not running. Call start_orchestrator first.")?;

    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params,
    });

    let payload = serde_json::to_vec(&request).map_err(|e| format!("JSON serialize error: {e}"))?;

    write_rpc_message(stdin, &payload).await?;

    // 创建 oneshot channel 等待响应
    let (tx, rx) = tokio::sync::oneshot::channel();
    guard.pending.lock().await.insert(id, tx);

    // 释放锁，等待响应
    drop(guard);

    // 等待响应（超时 180 秒，兼容高思考模型）
    match tokio::time::timeout(std::time::Duration::from_secs(180), rx).await {
        Ok(Ok(result)) => result,
        Ok(Err(_)) => Err("Response channel closed".to_string()),
        Err(_) => Err("RPC request timed out (180s)".to_string()),
    }
}

/// 停止 orchestrator 子进程
#[tauri::command]
async fn stop_orchestrator(state: State<'_, SharedState>) -> Result<RpcResult, String> {
    let mut guard = state.lock().await;

    if let Some(ref mut child) = guard.child {
        let _ = child.kill().await;
    }
    guard.child = None;
    guard.stdin = None;

    Ok(RpcResult {
        success: true,
        data: serde_json::json!({ "status": "stopped" }),
        error: None,
    })
}

/// 检查 orchestrator 是否在运行
#[tauri::command]
async fn orchestrator_status(state: State<'_, SharedState>) -> Result<RpcResult, String> {
    let guard = state.lock().await;
    let running = guard.child.is_some();

    Ok(RpcResult {
        success: true,
        data: serde_json::json!({ "running": running }),
        error: None,
    })
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(OrchestratorState::default()) as SharedState)
        .invoke_handler(tauri::generate_handler![
            start_orchestrator,
            send_rpc,
            stop_orchestrator,
            orchestrator_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
