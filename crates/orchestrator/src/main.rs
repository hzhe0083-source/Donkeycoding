mod adapter;
mod engine;
mod operators;
mod types;

use engine::{write_message, Engine};
use serde_json::{json, Value};
use std::io::{self, BufRead, Read, Write};
use types::*;

// 鈹€鈹€鈹€ JSON-RPC 璇诲彇 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

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

// 鈹€鈹€鈹€ 璇锋眰澶勭悊 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

/// 澶勭悊 config/setKeys锛氳缃?API Keys
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
        openai_compatible: params
            .get("openai_compatible")
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
        (!keys.openai_compatible.is_empty()).then_some("openai_compatible"),
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

/// 澶勭悊 session/start锛氬垱寤轰細璇濆苟鍚姩澶氳疆浼氳
async fn handle_session_start<W: Write>(
    engine: &mut Engine,
    params: Option<&Value>,
    writer: &mut W,
) -> Result<Value, JsonRpcError> {
    let default_request = || MeetingRequest {
        task: "untitled-task".to_string(),
        participants: Vec::new(),
        policy: Policy::default(),
        budget: Budget::default(),
        operators: OperatorsConfig::default(),
        review: ReviewPolicy::default(),
    };

    let mut request = if let Some(raw) = params {
        match serde_json::from_value::<MeetingRequest>(raw.clone()) {
            Ok(parsed) => parsed,
            Err(err) => {
                eprintln!("[engine] Failed to parse MeetingRequest, using defaults: {err}");
                default_request()
            }
        }
    } else {
        default_request()
    };

    if request.task.trim().is_empty() {
        request.task = "untitled-task".to_string();
    }

    if request.participants.is_empty() {
        request.participants = engine.default_participants();
    }

    eprintln!(
        "[engine] Starting session: task={}, participants={}, max_rounds={}",
        request.task,
        request.participants.len(),
        request.policy.stop.max_rounds.min(request.budget.max_rounds),
    );

    let session = engine.create_session(
        &request.task,
        request.participants,
        request.policy,
        request.budget,
        request.operators,
        request.review,
    );
    let session_id = session.session_id.clone();

    match engine.run_meeting(&session_id, writer).await {
        Ok(result) => Ok(result),
        Err(err) => {
            eprintln!("[engine] Meeting error: {err}");
            Ok(json!({
                "session_id": session_id,
                "status": "failed",
                "error": err,
            }))
        }
    }
}

/// 澶勭悊 chat/send锛氬湪鐜版湁浼氳瘽涓彂閫佹秷鎭苟鑾峰彇鍥炲
fn parse_chat_participants(params: Option<&Value>) -> Option<Vec<Participant>> {
    let raw = params.and_then(|p| p.get("participants"))?.clone();
    let parsed = serde_json::from_value::<Vec<Participant>>(raw).ok()?;
    if parsed.is_empty() {
        return None;
    }
    Some(parsed)
}

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

    let custom_participants = parse_chat_participants(params);

    // 濡傛灉鏈?session_id锛屽皾璇曞湪鐜版湁浼氳瘽涓拷鍔犳秷鎭?
    // 鍚﹀垯鍒涘缓鏂颁細璇?
    let sid = if let Some(sid) = session_id {
        if engine.get_session(sid).is_some() {
            // 杩藉姞鐢ㄦ埛娑堟伅鍒板巻鍙?
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
            // 浼氳瘽涓嶅瓨鍦紝鍒涘缓鏂扮殑
            let participants = custom_participants
                .clone()
                .unwrap_or_else(|| engine.default_participants());
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
        // 鏃?session_id锛屽垱寤烘柊浼氳瘽
        let participants = custom_participants.unwrap_or_else(|| engine.default_participants());
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

    // 鎵ц涓€杞璁?
    match engine.execute_turn(&sid, writer).await {
        Ok(turn_result) => {
            let session = engine.get_session(&sid);
            let outputs = turn_result
                .outputs
                .iter()
                .map(|output| {
                    json!({
                        "participant_id": output.participant_id,
                        "status": output.status,
                        "content": output.content,
                        "latency_ms": output.latency_ms,
                        "error": output.error,
                    })
                })
                .collect::<Vec<Value>>();

            Ok(json!({
                "session_id": sid,
                "status": session.map(|s| s.status.as_str()).unwrap_or("unknown"),
                "turn_index": turn_result.turn_index,
                "agreement_score": turn_result.agreement_score,
                "outputs_count": turn_result.outputs.len(),
                "outputs": outputs,
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

/// 澶勭悊 chat/stop锛氬仠姝細璇?
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

/// 澶勭悊 session/state锛氭煡璇細璇濈姸鎬?
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

/// 澶勭悊 workflow/execute锛氭寜姝ラ璋冪敤 API / 鎵ц鍛戒护锛屽彲閫夊洖鍒颁細璇濊璁?
async fn handle_workflow_execute<W: Write>(
    engine: &mut Engine,
    params: Option<&Value>,
    writer: &mut W,
) -> Result<Value, JsonRpcError> {
    let raw = params.ok_or_else(|| JsonRpcError {
        code: -32602,
        message: "Missing params for workflow/execute".to_string(),
    })?;

    let request: WorkflowExecuteRequest = serde_json::from_value(raw.clone()).map_err(|err| {
        JsonRpcError {
            code: -32602,
            message: format!("Invalid workflow/execute params: {err}"),
        }
    })?;

    engine
        .execute_workflow(request, writer)
        .await
        .map_err(|err| JsonRpcError {
            code: -32000,
            message: err,
        })
}

// 鈹€鈹€鈹€ 涓诲惊鐜?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

#[tokio::main]
async fn main() -> io::Result<()> {
    eprintln!("[engine] Workerflow Orchestrator starting...");

    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut reader = io::BufReader::new(stdin.lock());
    let mut writer = io::BufWriter::new(stdout.lock());

    // 浠庣幆澧冨彉閲忓姞杞?API Keys
    let api_keys = ApiKeys::from_env();
    let configured: Vec<&str> = [
        (!api_keys.openai.is_empty()).then_some("openai"),
        (!api_keys.openai_compatible.is_empty()).then_some("openai_compatible"),
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

        // 澶勭悊璇锋眰
        let Some(id) = request.id else {
            // Notification锛堟棤 id锛夛紝鐩墠蹇界暐
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

            "workflow/execute" => {
                handle_workflow_execute(&mut engine, request.params.as_ref(), &mut writer).await
            }

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

