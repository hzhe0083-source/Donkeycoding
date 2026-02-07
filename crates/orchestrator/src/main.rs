mod adapter;
mod engine;
mod operators;
mod types;

use engine::{write_message, Engine};
use serde_json::{json, Value};
use std::io::{self, BufRead, Read, Write};
use types::*;

// ─── JSON-RPC 读取 ───────────────────────────────────────────────

fn read_headers<R: BufRead>(reader: &mut R) -> io::Result<Option<usize>> {
    let mut content_length: Option<usize> = None;
    loop {
        let mut line = String::new();
        let bytes_read = reader.read_line(&mut line)?;
        if bytes_read == 0 {
            return Ok(None);
        }
        let line_trimmed = line.trim_end_matches(['\r', '\n']);
        if line_trimmed.is_empty() {
            return Ok(content_length);
        }
        if let Some((key, value)) = line_trimmed.split_once(':') {
            if key.eq_ignore_ascii_case("Content-Length") {
                let parsed = value.trim().parse::<usize>().map_err(|_| {
                    io::Error::new(io::ErrorKind::InvalidData, "invalid Content-Length")
                })?;
                content_length = Some(parsed);
            }
        }
    }
}

fn write_response<W: Write>(writer: &mut W, response: &JsonRpcResponse) -> io::Result<()> {
    let value = serde_json::to_value(response)
        .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err.to_string()))?;
    write_message(writer, &value)
}

fn write_error<W: Write>(writer: &mut W, response: &JsonRpcErrorResponse) -> io::Result<()> {
    let value = serde_json::to_value(response)
        .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err.to_string()))?;
    write_message(writer, &value)
}

// ─── 请求处理 ────────────────────────────────────────────────────

/// 处理 config/setKeys：设置 API Keys
fn handle_set_keys(engine: &mut Engine, params: Option<&Value>) -> Result<Value, JsonRpcError> {
    let params = params.ok_or_else(|| JsonRpcError {
        code: -32602,
        message: "Missing params for config/setKeys".to_string(),
    })?;

    let keys = ApiKeys {
        openai: params
            .get("openai")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string(),
        anthropic: params
            .get("anthropic")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string(),
        google: params
            .get("google")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string(),
        deepseek: params
            .get("deepseek")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string(),
    };

    let configured: Vec<&str> = [
        (!keys.openai.is_empty()).then_some("openai"),
        (!keys.anthropic.is_empty()).then_some("anthropic"),
        (!keys.google.is_empty()).then_some("google"),
        (!keys.deepseek.is_empty()).then_some("deepseek"),
    ]
    .into_iter()
    .flatten()
    .collect();

    engine.set_api_keys(keys);

    eprintln!("[engine] API keys updated: {:?}", configured);

    Ok(json!({
        "status": "ok",
        "configured_providers": configured,
    }))
}

/// 处理 session/start：创建会话并启动多轮会议
async fn handle_session_start<W: Write>(
    engine: &mut Engine,
    params: Option<&Value>,
    writer: &mut W,
) -> Result<Value, JsonRpcError> {
    let task = params
        .and_then(|p| p.get("task"))
        .and_then(Value::as_str)
        .unwrap_or("untitled-task");

    // 解析参与者（如果提供了的话）
    let participants = if let Some(p_val) = params.and_then(|p| p.get("participants")) {
        serde_json::from_value::<Vec<Participant>>(p_val.clone()).unwrap_or_else(|_| {
            eprintln!("[engine] Failed to parse participants, using defaults");
            engine.default_participants()
        })
    } else {
        engine.default_participants()
    };

    // 解析策略
    let policy = if let Some(p_val) = params.and_then(|p| p.get("policy")) {
        serde_json::from_value::<Policy>(p_val.clone()).unwrap_or_default()
    } else {
        Policy::default()
    };

    // 解析预算
    let budget = if let Some(b_val) = params.and_then(|p| p.get("budget")) {
        serde_json::from_value::<Budget>(b_val.clone()).unwrap_or_default()
    } else {
        Budget::default()
    };

    // 解析算子链配置
    let operators = if let Some(o_val) = params.and_then(|p| p.get("operators")) {
        serde_json::from_value::<OperatorsConfig>(o_val.clone()).unwrap_or_default()
    } else {
        OperatorsConfig::default()
    };

    // 解析审核策略
    let review = if let Some(r_val) = params.and_then(|p| p.get("review")) {
        serde_json::from_value::<ReviewPolicy>(r_val.clone()).unwrap_or_default()
    } else {
        ReviewPolicy::default()
    };

    eprintln!(
        "[engine] Starting session: task={}, participants={}, max_rounds={}",
        task,
        participants.len(),
        policy.stop.max_rounds.min(budget.max_rounds),
    );

    // 创建会话
    let session = engine.create_session(task, participants, policy, budget, operators, review);
    let session_id = session.session_id.clone();

    // 运行多轮会议
    match engine.run_meeting(&session_id, writer).await {
        Ok(result) => Ok(result),
        Err(err) => {
            eprintln!("[engine] Meeting error: {err}");
            // 即使出错也返回会话信息
            Ok(json!({
                "session_id": session_id,
                "status": "failed",
                "error": err,
            }))
        }
    }
}

/// 处理 chat/send：在现有会话中发送消息并获取回复
async fn handle_chat_send<W: Write>(
    engine: &mut Engine,
    params: Option<&Value>,
    writer: &mut W,
) -> Result<Value, JsonRpcError> {
    let session_id = params
        .and_then(|p| p.get("session_id"))
        .and_then(Value::as_str);

    let user_message = params
        .and_then(|p| p.get("message"))
        .and_then(Value::as_str)
        .unwrap_or("");

    if user_message.trim().is_empty() {
        return Err(JsonRpcError {
            code: -32602,
            message: "Empty message".to_string(),
        });
    }

    // 如果有 session_id，尝试在现有会话中追加消息
    // 否则创建新会话
    let sid = if let Some(sid) = session_id {
        if engine.get_session(sid).is_some() {
            // 追加用户消息到历史
            if let Some(session) = engine.get_session_mut(sid) {
                session.history.push(ChatMessage {
                    role: "user".to_string(),
                    content: user_message.to_string(),
                    participant_id: None,
                });
                session.status = "running".to_string();
            }
            sid.to_string()
        } else {
            // 会话不存在，创建新的
            let participants = engine.default_participants();
            let session = engine.create_session(
                user_message,
                participants,
                Policy::default(),
                Budget::default(),
                OperatorsConfig::default(),
                ReviewPolicy::default(),
            );
            let new_sid = session.session_id.clone();
            if let Some(session) = engine.get_session_mut(&new_sid) {
                session.history.push(ChatMessage {
                    role: "user".to_string(),
                    content: user_message.to_string(),
                    participant_id: None,
                });
            }
            new_sid
        }
    } else {
        // 无 session_id，创建新会话
        let participants = engine.default_participants();
        let session = engine.create_session(
            user_message,
            participants,
            Policy::default(),
            Budget::default(),
            OperatorsConfig::default(),
            ReviewPolicy::default(),
        );
        let new_sid = session.session_id.clone();
        if let Some(session) = engine.get_session_mut(&new_sid) {
            session.history.push(ChatMessage {
                role: "user".to_string(),
                content: user_message.to_string(),
                participant_id: None,
            });
        }
        new_sid
    };

    eprintln!(
        "[engine] chat/send: session={}, message_len={}",
        sid,
        user_message.len()
    );

    // 执行一轮讨论
    match engine.execute_turn(&sid, writer).await {
        Ok(turn_result) => {
            let session = engine.get_session(&sid);
            Ok(json!({
                "session_id": sid,
                "status": session.map(|s| s.status.as_str()).unwrap_or("unknown"),
                "turn_index": turn_result.turn_index,
                "agreement_score": turn_result.agreement_score,
                "outputs_count": turn_result.outputs.len(),
                "total_tokens": session.map(|s| s.total_tokens).unwrap_or(0),
                "total_cost": session.map(|s| s.total_cost).unwrap_or(0.0),
            }))
        }
        Err(err) => {
            eprintln!("[engine] chat/send turn error: {err}");
            Err(JsonRpcError {
                code: -32000,
                message: format!("Turn execution failed: {err}"),
            })
        }
    }
}

/// 处理 chat/stop：停止会话
fn handle_chat_stop(engine: &mut Engine, params: Option<&Value>) -> Result<Value, JsonRpcError> {
    let session_id = params
        .and_then(|p| p.get("session_id"))
        .and_then(Value::as_str)
        .unwrap_or("unknown");

    if let Some(session) = engine.get_session_mut(session_id) {
        session.status = "stopped".to_string();
        eprintln!("[engine] Session stopped: {session_id}");
    }

    Ok(json!({
        "session_id": session_id,
        "status": "stopped",
    }))
}

/// 处理 session/state：查询会话状态
fn handle_session_state(engine: &Engine, params: Option<&Value>) -> Result<Value, JsonRpcError> {
    let session_id = params
        .and_then(|p| p.get("session_id"))
        .and_then(Value::as_str)
        .ok_or_else(|| JsonRpcError {
            code: -32602,
            message: "Missing session_id".to_string(),
        })?;

    let session = engine.get_session(session_id).ok_or_else(|| JsonRpcError {
        code: -32001,
        message: format!("Session not found: {session_id}"),
    })?;

    Ok(json!({
        "session_id": session.session_id,
        "status": session.status,
        "current_turn": session.current_turn,
        "total_tokens": session.total_tokens,
        "total_cost": session.total_cost,
        "turns_count": session.turns.len(),
        "participants_count": session.participants.len(),
    }))
}

// ─── 主循环 ──────────────────────────────────────────────────────

#[tokio::main]
async fn main() -> io::Result<()> {
    eprintln!("[engine] Workerflow Orchestrator starting...");

    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut reader = io::BufReader::new(stdin.lock());
    let mut writer = io::BufWriter::new(stdout.lock());

    // 从环境变量加载 API Keys
    let api_keys = ApiKeys::from_env();
    let configured: Vec<&str> = [
        (!api_keys.openai.is_empty()).then_some("openai"),
        (!api_keys.anthropic.is_empty()).then_some("anthropic"),
        (!api_keys.google.is_empty()).then_some("google"),
        (!api_keys.deepseek.is_empty()).then_some("deepseek"),
    ]
    .into_iter()
    .flatten()
    .collect();
    eprintln!("[engine] API keys from env: {:?}", configured);

    let mut engine = Engine::new(api_keys);

    eprintln!("[engine] Ready, waiting for JSON-RPC requests on stdin...");

    loop {
        let Some(content_length) = read_headers(&mut reader)? else {
            eprintln!("[engine] stdin closed, shutting down.");
            break;
        };

        let mut body = vec![0_u8; content_length];
        reader.read_exact(&mut body)?;

        let request: JsonRpcRequest = match serde_json::from_slice(&body) {
            Ok(req) => req,
            Err(err) => {
                eprintln!("[engine] Parse error: {err}");
                let error = JsonRpcErrorResponse {
                    jsonrpc: "2.0",
                    id: Value::Null,
                    error: JsonRpcError {
                        code: -32700,
                        message: "Parse error".to_string(),
                    },
                };
                write_error(&mut writer, &error)?;
                continue;
            }
        };

        eprintln!(
            "[engine] Received: method={}, id={:?}",
            request.method, request.id
        );

        // 处理请求
        let Some(id) = request.id else {
            // Notification（无 id），目前忽略
            eprintln!("[engine] Ignoring notification: {}", request.method);
            continue;
        };

        let result = match request.method.as_str() {
            "ping" => Ok(json!({ "pong": true })),

            "config/setKeys" => handle_set_keys(&mut engine, request.params.as_ref()),

            "session/start" => {
                handle_session_start(&mut engine, request.params.as_ref(), &mut writer).await
            }

            "chat/send" => {
                handle_chat_send(&mut engine, request.params.as_ref(), &mut writer).await
            }

            "chat/stop" => handle_chat_stop(&mut engine, request.params.as_ref()),

            "session/state" => handle_session_state(&engine, request.params.as_ref()),

            _ => Err(JsonRpcError {
                code: -32601,
                message: format!("Method not found: {}", request.method),
            }),
        };

        match result {
            Ok(result_value) => {
                let response = JsonRpcResponse {
                    jsonrpc: "2.0",
                    id,
                    result: result_value,
                };
                write_response(&mut writer, &response)?;
            }
            Err(error) => {
                let response = JsonRpcErrorResponse {
                    jsonrpc: "2.0",
                    id,
                    error,
                };
                write_error(&mut writer, &response)?;
            }
        }
    }

    Ok(())
}
