use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io::{self, BufRead, Read, Write};

#[derive(Debug, Default)]
struct EngineState {
    active_session_id: Option<String>,
    turn_index: u64,
    event_seq: u64,
}

impl EngineState {
    fn next_event_seq(&mut self) -> u64 {
        self.event_seq += 1;
        self.event_seq
    }

    fn next_turn(&mut self) -> u64 {
        self.turn_index += 1;
        self.turn_index
    }
}

#[derive(Debug, Deserialize)]
struct JsonRpcRequest {
    #[allow(dead_code)]
    jsonrpc: Option<String>,
    id: Option<Value>,
    method: String,
    params: Option<Value>,
}

#[derive(Debug, Serialize)]
struct JsonRpcResponse {
    jsonrpc: &'static str,
    id: Value,
    result: Value,
}

#[derive(Debug, Serialize)]
struct JsonRpcErrorResponse {
    jsonrpc: &'static str,
    id: Value,
    error: JsonRpcError,
}

#[derive(Debug, Serialize)]
struct JsonRpcError {
    code: i32,
    message: String,
}

fn session_id_from_task(task: &str) -> String {
    format!("sess-{}", task.replace(' ', "-").to_lowercase())
}

fn default_participants() -> Value {
    json!([
        {
            "participant_id": "p-openai-proposer",
            "role": "proposer",
            "provider": "openai",
            "model_id": "gpt-4.1"
        },
        {
            "participant_id": "p-anthropic-critic",
            "role": "critic",
            "provider": "anthropic",
            "model_id": "claude-3.7-sonnet"
        },
        {
            "participant_id": "p-google-arbiter",
            "role": "arbiter",
            "provider": "google",
            "model_id": "gemini-2.0-flash"
        }
    ])
}

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
                let parsed = value
                    .trim()
                    .parse::<usize>()
                    .map_err(|_| io::Error::new(io::ErrorKind::InvalidData, "invalid Content-Length"))?;
                content_length = Some(parsed);
            }
        }
    }
}

fn write_message<W: Write>(writer: &mut W, payload: &Value) -> io::Result<()> {
    let bytes = serde_json::to_vec(payload)
        .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err.to_string()))?;
    write!(writer, "Content-Length: {}\r\n\r\n", bytes.len())?;
    writer.write_all(&bytes)?;
    writer.flush()
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

fn write_notification<W: Write>(writer: &mut W, method: &str, params: Value) -> io::Result<()> {
    let notification = json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": params
    });
    write_message(writer, &notification)
}

fn normalize_message_to_reply(message: &str) -> String {
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return "我收到了空消息。你可以描述一下具体任务，我来给出方案。".to_string();
    }

    if trimmed.chars().count() <= 80 {
        return format!(
            "收到：\"{}\"\n\n建议下一步：\n1) 明确目标\n2) 给出约束\n3) 让我生成可执行计划",
            trimmed
        );
    }

    format!(
        "我已收到你的需求摘要：\n{}\n\n我建议先拆成三个部分：\n- 目标定义\n- 技术方案\n- 验收标准",
        trimmed
    )
}

fn chunk_text(text: &str, max_chars: usize) -> Vec<String> {
    if max_chars == 0 {
        return vec![text.to_string()];
    }

    let mut chunks: Vec<String> = Vec::new();
    let mut current = String::new();

    for ch in text.chars() {
        current.push(ch);
        if current.chars().count() >= max_chars {
            chunks.push(current.clone());
            current.clear();
        }
    }

    if !current.is_empty() {
        chunks.push(current);
    }

    if chunks.is_empty() {
        chunks.push(String::new());
    }

    chunks
}

fn emit_chat_stream<W: Write>(
    writer: &mut W,
    state: &mut EngineState,
    session_id: &str,
    turn_index: u64,
    participant_id: &str,
    assistant_text: &str,
) -> io::Result<()> {
    for delta in chunk_text(assistant_text, 28) {
        write_notification(
            writer,
            "turn/chunk",
            json!({
                "session_id": session_id,
                "turn_index": turn_index,
                "event_seq": state.next_event_seq(),
                "participant_id": participant_id,
                "delta": delta,
            }),
        )?;
    }

    write_notification(
        writer,
        "turn/complete",
        json!({
            "session_id": session_id,
            "turn_index": turn_index,
            "event_seq": state.next_event_seq(),
            "participant_id": participant_id,
            "status": "success",
            "latency_ms": 120,
        }),
    )?;

    write_notification(
        writer,
        "session/progress",
        json!({
            "session_id": session_id,
            "turn_index": turn_index,
            "event_seq": state.next_event_seq(),
            "total_tokens": 128 + (turn_index as i64 * 32),
            "total_cost": 0.0032 + (turn_index as f64 * 0.0006),
            "agreement_score": 0.58 + (turn_index as f64 * 0.03),
        }),
    )?;

    Ok(())
}

fn handle_method(method: &str, params: Option<Value>) -> Result<Value, JsonRpcError> {
    match method {
        "ping" => Ok(json!({ "pong": true })),
        "session/start" => {
            let task = params
                .as_ref()
                .and_then(|p| p.get("task"))
                .and_then(Value::as_str)
                .unwrap_or("untitled-task");

            let session_id = session_id_from_task(task);
            let participants = default_participants();

            Ok(json!({
                "session_id": session_id,
                "status": "running",
                "participants": participants,
                "stats": {
                    "total_tokens": 0,
                    "total_cost": 0.0,
                    "agreement_score": 0.0
                }
            }))
        }
        "chat/stop" => {
            let session_id = params
                .as_ref()
                .and_then(|p| p.get("session_id"))
                .and_then(Value::as_str)
                .unwrap_or("sess-chat");

            Ok(json!({
                "session_id": session_id,
                "status": "stopped"
            }))
        }
        _ => Err(JsonRpcError {
            code: -32601,
            message: format!("Method not found: {method}"),
        }),
    }
}

fn handle_chat_send<W: Write>(
    writer: &mut W,
    state: &mut EngineState,
    params: Option<&Value>,
) -> io::Result<Value> {
    let provided_session_id = params
        .and_then(|p| p.get("session_id"))
        .and_then(Value::as_str)
        .map(ToOwned::to_owned);

    let session_id = if let Some(id) = provided_session_id {
        id
    } else if let Some(active) = state.active_session_id.clone() {
        active
    } else {
        "sess-chat".to_string()
    };

    state.active_session_id = Some(session_id.clone());

    let user_message = params
        .and_then(|p| p.get("message"))
        .and_then(Value::as_str)
        .unwrap_or("");

    let assistant_text = normalize_message_to_reply(user_message);
    let turn_index = state.next_turn();
    let participant_id = "p-openai-assistant";

    emit_chat_stream(
        writer,
        state,
        &session_id,
        turn_index,
        participant_id,
        &assistant_text,
    )?;

    Ok(json!({
        "session_id": session_id,
        "status": "running",
        "turn_index": turn_index,
        "assistant_text": assistant_text,
        "participant_id": participant_id,
    }))
}

fn main() -> io::Result<()> {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut reader = io::BufReader::new(stdin.lock());
    let mut writer = io::BufWriter::new(stdout.lock());
    let mut state = EngineState::default();

    loop {
        let Some(content_length) = read_headers(&mut reader)? else {
            break;
        };

        let mut body = vec![0_u8; content_length];
        reader.read_exact(&mut body)?;

        let request: JsonRpcRequest = match serde_json::from_slice(&body) {
            Ok(req) => req,
            Err(_) => {
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

        if request.method == "session/start" {
            let task = request
                .params
                .as_ref()
                .and_then(|p| p.get("task"))
                .and_then(Value::as_str)
                .unwrap_or("untitled-task");
            let session_id = session_id_from_task(task);
            let participants = default_participants();
            state.active_session_id = Some(session_id.clone());
            state.turn_index = 0;
            state.event_seq = 0;

            let _ = write_notification(
                &mut writer,
                "session/state",
                json!({
                    "session_id": session_id,
                    "status": "running",
                    "event_seq": state.next_event_seq(),
                    "reason": "session_started"
                }),
            );
            let _ = write_notification(
                &mut writer,
                "session/participants",
                json!({
                    "session_id": session_id,
                    "event_seq": state.next_event_seq(),
                    "participants": participants
                }),
            );
            let _ = write_notification(
                &mut writer,
                "session/progress",
                json!({
                    "session_id": session_id,
                    "event_seq": state.next_event_seq(),
                    "turn_index": 1,
                    "total_tokens": 128,
                    "total_cost": 0.0032,
                    "agreement_score": 0.62
                }),
            );
            state.turn_index = 1;
            let _ = write_notification(
                &mut writer,
                "turn/complete",
                json!({
                    "session_id": session_id,
                    "turn_index": 1,
                    "event_seq": state.next_event_seq(),
                    "participant_id": "p-openai-proposer",
                    "status": "success",
                    "latency_ms": 835
                }),
            );
        }

        if let Some(id) = request.id {
            if request.method == "chat/send" {
                match handle_chat_send(&mut writer, &mut state, request.params.as_ref()) {
                    Ok(result) => {
                        let response = JsonRpcResponse {
                            jsonrpc: "2.0",
                            id,
                            result,
                        };
                        write_response(&mut writer, &response)?;
                    }
                    Err(err) => {
                        let response = JsonRpcErrorResponse {
                            jsonrpc: "2.0",
                            id,
                            error: JsonRpcError {
                                code: -32000,
                                message: format!("chat/send failed: {err}"),
                            },
                        };
                        write_error(&mut writer, &response)?;
                    }
                }
                continue;
            }

            match handle_method(&request.method, request.params) {
                Ok(result) => {
                    let response = JsonRpcResponse {
                        jsonrpc: "2.0",
                        id,
                        result,
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
    }

    Ok(())
}
