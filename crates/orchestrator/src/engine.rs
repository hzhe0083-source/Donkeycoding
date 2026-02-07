use crate::adapter::LlmAdapter;
use crate::operators::{OperatorRegistry, TurnContext};
use crate::types::*;
use serde_json::{json, Value};
use std::cmp::Ordering;
use std::collections::HashMap;
use std::io::Write;

const STREAM_CHUNK_CHARS: usize = 80;
const HISTORY_LIMIT: usize = 80;

pub struct Engine {
    pub adapter: LlmAdapter,
    pub sessions: HashMap<String, SessionState>,
    event_seq: u64,
    operators: OperatorRegistry,
}

impl Engine {
    pub fn new(api_keys: ApiKeys) -> Self {
        Self {
            adapter: LlmAdapter::new(api_keys),
            sessions: HashMap::new(),
            event_seq: 0,
            operators: OperatorRegistry::new(),
        }
    }

    pub fn next_event_seq(&mut self) -> u64 {
        self.event_seq += 1;
        self.event_seq
    }

    pub fn set_api_keys(&mut self, keys: ApiKeys) {
        self.adapter.set_api_keys(keys);
    }

    pub fn create_session(
        &mut self,
        task: &str,
        participants: Vec<Participant>,
        policy: Policy,
        budget: Budget,
        operators: OperatorsConfig,
        review: ReviewPolicy,
    ) -> &SessionState {
        let session_id = format!(
            "sess-{}",
            uuid::Uuid::new_v4()
                .to_string()
                .split('-')
                .next()
                .unwrap_or("0000")
        );

        let session = SessionState {
            session_id: session_id.clone(),
            status: "running".to_string(),
            current_turn: 0,
            turns: Vec::new(),
            total_tokens: 0,
            total_cost: 0.0,
            task: task.to_string(),
            participants,
            policy,
            budget,
            operators,
            review,
            last_review: ReviewReport::default(),
            history: Vec::new(),
        };

        self.sessions.insert(session_id.clone(), session);
        self.sessions.get(&session_id).expect("session inserted")
    }

    pub fn get_session_mut(&mut self, session_id: &str) -> Option<&mut SessionState> {
        self.sessions.get_mut(session_id)
    }

    pub fn get_session(&self, session_id: &str) -> Option<&SessionState> {
        self.sessions.get(session_id)
    }

    pub fn default_participants(&self) -> Vec<Participant> {
        let keys = self.adapter.api_keys();
        let mut participants = Vec::new();

        if !keys.openai.is_empty() {
            participants.push(Participant {
                participant_id: "p-openai-proposer".to_string(),
                role: Role::Proposer,
                provider: Provider::OpenAI,
                model_id: "gpt-4o-mini".to_string(),
                api_key: String::new(),
                endpoint: String::new(),
                vote_weight: 1.0,
                priority: 0,
            });
        }

        if !keys.anthropic.is_empty() {
            participants.push(Participant {
                participant_id: "p-anthropic-critic".to_string(),
                role: Role::Critic,
                provider: Provider::Anthropic,
                model_id: "claude-sonnet-4-20250514".to_string(),
                api_key: String::new(),
                endpoint: String::new(),
                vote_weight: 1.0,
                priority: 1,
            });
        }

        if !keys.google.is_empty() {
            participants.push(Participant {
                participant_id: "p-google-synthesizer".to_string(),
                role: Role::Synthesizer,
                provider: Provider::Google,
                model_id: "gemini-2.0-flash".to_string(),
                api_key: String::new(),
                endpoint: String::new(),
                vote_weight: 1.0,
                priority: 2,
            });
        }

        if !keys.deepseek.is_empty() {
            participants.push(Participant {
                participant_id: "p-deepseek-researcher".to_string(),
                role: Role::Researcher,
                provider: Provider::DeepSeek,
                model_id: "deepseek-chat".to_string(),
                api_key: String::new(),
                endpoint: String::new(),
                vote_weight: 1.0,
                priority: 3,
            });
        }

        if participants.is_empty() {
            participants.push(Participant {
                participant_id: "p-openai-proposer".to_string(),
                role: Role::Proposer,
                provider: Provider::OpenAI,
                model_id: "gpt-4o-mini".to_string(),
                api_key: String::new(),
                endpoint: String::new(),
                vote_weight: 1.0,
                priority: 0,
            });
        }

        participants
    }

    pub async fn execute_turn<W: Write>(
        &mut self,
        session_id: &str,
        writer: &mut W,
    ) -> Result<TurnResult, String> {
        let session = self
            .sessions
            .get(session_id)
            .ok_or_else(|| format!("Session not found: {session_id}"))?;

        let turn_index = session.current_turn + 1;
        let task = session.task.clone();
        let history = session.history.clone();
        let participants = session.participants.clone();
        let operator_chain = session.operators.chain.clone();

        let user_message = history
            .iter()
            .rev()
            .find(|message| message.role == "user")
            .map(|message| message.content.clone())
            .unwrap_or_else(|| task.clone());

        let mut turn_context = TurnContext::new(task, user_message, history, participants);
        self.operators
            .apply_before(&operator_chain, &mut turn_context);

        let mut ordered_participants = turn_context.participants.clone();
        ordered_participants.sort_by(|left, right| match left.priority.cmp(&right.priority) {
            Ordering::Equal => left.participant_id.cmp(&right.participant_id),
            other => other,
        });

        let mut outputs = Vec::new();
        let mut all_contents: Vec<(String, String)> = Vec::new();

        for participant in &ordered_participants {
            let mut messages = Vec::new();
            messages.push(ChatMessage {
                role: "system".to_string(),
                content: turn_context.system_prompt_for(participant),
                participant_id: None,
            });

            messages.extend(turn_context.history.clone());

            for (participant_id, content) in &all_contents {
                messages.push(ChatMessage {
                    role: "assistant".to_string(),
                    content: format!("[{participant_id}]: {content}"),
                    participant_id: Some(participant_id.clone()),
                });
            }

            if turn_context.history.is_empty() && all_contents.is_empty() {
                messages.push(ChatMessage {
                    role: "user".to_string(),
                    content: turn_context.user_message.clone(),
                    participant_id: None,
                });
            }

            let seq = self.next_event_seq();
            let _ = write_notification(
                writer,
                "turn/chunk",
                json!({
                    "session_id": session_id,
                    "turn_index": turn_index,
                    "event_seq": seq,
                    "participant_id": &participant.participant_id,
                    "delta": format!("[{}({}) thinking...]\n", participant.role.label(), participant.model_id),
                }),
            );

            let output = self.adapter.call(participant, &messages).await;

            if output.status == "success" && !output.content.is_empty() {
                for chunk in chunk_text(&output.content, STREAM_CHUNK_CHARS) {
                    let seq = self.next_event_seq();
                    let _ = write_notification(
                        writer,
                        "turn/chunk",
                        json!({
                            "session_id": session_id,
                            "turn_index": turn_index,
                            "event_seq": seq,
                            "participant_id": &participant.participant_id,
                            "delta": chunk,
                        }),
                    );
                }
            }

            let seq = self.next_event_seq();
            let _ = write_notification(
                writer,
                "turn/complete",
                json!({
                    "session_id": session_id,
                    "turn_index": turn_index,
                    "event_seq": seq,
                    "participant_id": &participant.participant_id,
                    "status": &output.status,
                    "latency_ms": output.latency_ms,
                }),
            );

            if output.status == "success" {
                all_contents.push((participant.participant_id.clone(), output.content.clone()));
            }

            outputs.push(output);
        }

        turn_context.outputs = outputs.clone();
        self.operators
            .apply_after(&operator_chain, &mut turn_context);
        outputs = turn_context.outputs.clone();

        let agreement_score = calculate_agreement(&outputs, turn_index);

        let turn_result = TurnResult {
            turn_index,
            outputs,
            agreement_score,
        };

        let mut progress_snapshot: Option<(u64, f64)> = None;

        if let Some(session) = self.sessions.get_mut(session_id) {
            session.current_turn = turn_index;
            session.turns.push(turn_result.clone());

            for output in &session.turns.last().expect("turn exists").outputs {
                session.total_tokens += output.tokens_used.total_tokens;
                session.total_cost += output.cost_estimate;
            }

            for (participant_id, content) in &all_contents {
                session.history.push(ChatMessage {
                    role: "assistant".to_string(),
                    content: content.clone(),
                    participant_id: Some(participant_id.clone()),
                });
            }

            if session.history.len() > HISTORY_LIMIT {
                let keep_from = session.history.len() - HISTORY_LIMIT;
                session.history = session.history.split_off(keep_from);
            }

            session.last_review = build_review_report(
                &session.review,
                turn_index,
                &session.turns.last().expect("turn exists").outputs,
            );

            progress_snapshot = Some((session.total_tokens, session.total_cost));
        }

        if let Some((total_tokens, total_cost)) = progress_snapshot {
            let seq = self.next_event_seq();
            let _ = write_notification(
                writer,
                "session/progress",
                json!({
                    "session_id": session_id,
                    "turn_index": turn_index,
                    "event_seq": seq,
                    "total_tokens": total_tokens,
                    "total_cost": total_cost,
                    "agreement_score": agreement_score,
                    "operator_trace": turn_context.trace,
                }),
            );
        }

        Ok(turn_result)
    }

    pub fn should_stop(&self, session_id: &str) -> (bool, &'static str) {
        let session = match self.sessions.get(session_id) {
            Some(session) => session,
            None => return (true, "session_not_found"),
        };

        if session.current_turn >= session.policy.stop.max_rounds as u64 {
            return (true, "max_rounds_reached");
        }

        if session.current_turn >= session.budget.max_rounds as u64 {
            return (true, "budget_max_rounds_reached");
        }

        if session.total_tokens >= session.budget.max_tokens {
            return (true, "token_budget_exceeded");
        }

        if session.total_cost >= session.budget.max_cost {
            return (true, "cost_budget_exceeded");
        }

        let min_consecutive = session.policy.stop.min_consecutive_agreement as usize;
        let threshold = session.policy.stop.agreement_threshold;

        if session.turns.len() >= min_consecutive {
            let recent = &session.turns[session.turns.len() - min_consecutive..];
            if recent.iter().all(|turn| turn.agreement_score >= threshold) {
                return (true, "agreement_reached");
            }
        }

        (false, "")
    }

    pub async fn run_meeting<W: Write>(
        &mut self,
        session_id: &str,
        writer: &mut W,
    ) -> Result<Value, String> {
        let seq = self.next_event_seq();
        let _ = write_notification(
            writer,
            "session/state",
            json!({
                "session_id": session_id,
                "status": "running",
                "event_seq": seq,
                "reason": "meeting_started",
            }),
        );

        let participants_json = {
            let session = self
                .sessions
                .get(session_id)
                .ok_or_else(|| format!("Session not found: {session_id}"))?;
            serde_json::to_value(&session.participants).unwrap_or(json!([]))
        };

        let seq = self.next_event_seq();
        let _ = write_notification(
            writer,
            "session/participants",
            json!({
                "session_id": session_id,
                "event_seq": seq,
                "participants": participants_json,
            }),
        );

        let max_rounds = {
            let session = self
                .sessions
                .get(session_id)
                .ok_or_else(|| format!("Session not found: {session_id}"))?;
            session
                .policy
                .stop
                .max_rounds
                .min(session.budget.max_rounds)
        };

        for _ in 0..max_rounds {
            let (should_stop, _) = self.should_stop(session_id);
            if should_stop {
                break;
            }

            if let Err(err) = self.execute_turn(session_id, writer).await {
                eprintln!("[engine] execute_turn failed: {err}");
                break;
            }
        }

        let (stopped, reason) = self.should_stop(session_id);
        let stop_reason = if stopped {
            reason
        } else {
            "all_rounds_completed"
        };

        if let Some(session) = self.sessions.get_mut(session_id) {
            session.status = "completed".to_string();
        }

        let seq = self.next_event_seq();
        let _ = write_notification(
            writer,
            "session/state",
            json!({
                "session_id": session_id,
                "status": "completed",
                "event_seq": seq,
                "reason": stop_reason,
            }),
        );

        let session = self
            .sessions
            .get(session_id)
            .ok_or_else(|| format!("Session not found: {session_id}"))?;

        Ok(json!({
            "session_id": session_id,
            "status": session.status,
            "total_turns": session.current_turn,
            "total_tokens": session.total_tokens,
            "total_cost": session.total_cost,
            "final_agreement": session.turns.last().map(|turn| turn.agreement_score).unwrap_or(0.0),
            "stop_reason": stop_reason,
            "operators": session.operators,
            "review": session.last_review,
        }))
    }
}

impl Role {
    pub fn label(&self) -> &'static str {
        match self {
            Role::Proposer => "Proposer",
            Role::Critic => "Critic",
            Role::Synthesizer => "Synthesizer",
            Role::Arbiter => "Arbiter",
            Role::Researcher => "Researcher",
            Role::Verifier => "Verifier",
        }
    }
}

fn calculate_agreement(outputs: &[ParticipantOutput], turn_index: u64) -> f64 {
    let success_count = outputs
        .iter()
        .filter(|output| output.status == "success")
        .count();
    let total_count = outputs.len().max(1);

    if success_count >= 2 {
        let base = success_count as f64 / total_count as f64;
        let round_bonus = (turn_index as f64 * 0.05).min(0.2);
        (base * 0.7 + round_bonus + 0.1).min(1.0)
    } else {
        success_count as f64 / total_count as f64 * 0.5
    }
}

fn build_review_report(
    policy: &ReviewPolicy,
    turn_index: u64,
    outputs: &[ParticipantOutput],
) -> ReviewReport {
    if !policy.enabled {
        return ReviewReport {
            generated_at_turn: turn_index,
            summary: "review disabled".to_string(),
            overall_risk: "LOW".to_string(),
            findings: Vec::new(),
        };
    }

    let max_findings = policy.max_findings.max(1) as usize;
    let min_rank = severity_rank(&policy.min_severity);
    let mut findings = Vec::new();

    for output in outputs {
        if output.status != "success" {
            continue;
        }

        let content = output.content.trim();
        if content.is_empty() {
            continue;
        }

        let lowered = content.to_lowercase();
        let inferred_severity = if lowered.contains("critical") || lowered.contains("高危") {
            "CRITICAL"
        } else if lowered.contains("high") || lowered.contains("高") {
            "HIGH"
        } else if lowered.contains("medium") || lowered.contains("中") {
            "MEDIUM"
        } else {
            "LOW"
        };

        if severity_rank(inferred_severity) < min_rank {
            continue;
        }

        let evidence = if policy.require_evidence {
            content.chars().take(140).collect::<String>()
        } else {
            String::new()
        };

        findings.push(ReviewFinding {
            severity: inferred_severity.to_string(),
            title: format!("Potential issue from {}", output.participant_id),
            evidence,
            suggestion: "Please verify and apply targeted fix with tests.".to_string(),
            source_participant_id: output.participant_id.clone(),
        });

        if findings.len() >= max_findings {
            break;
        }
    }

    let overall_risk = findings
        .iter()
        .map(|f| severity_rank(&f.severity))
        .max()
        .map(rank_to_severity)
        .unwrap_or("LOW")
        .to_string();

    let summary = if findings.is_empty() {
        format!(
            "No findings above {} at turn {}",
            policy.min_severity, turn_index
        )
    } else {
        format!(
            "{} findings at turn {}, highest risk {}",
            findings.len(),
            turn_index,
            overall_risk
        )
    };

    ReviewReport {
        generated_at_turn: turn_index,
        summary,
        overall_risk,
        findings,
    }
}

fn severity_rank(severity: &str) -> u8 {
    match severity.to_uppercase().as_str() {
        "CRITICAL" => 4,
        "HIGH" => 3,
        "MEDIUM" => 2,
        "LOW" => 1,
        _ => 0,
    }
}

fn rank_to_severity(rank: u8) -> &'static str {
    match rank {
        4 => "CRITICAL",
        3 => "HIGH",
        2 => "MEDIUM",
        1 => "LOW",
        _ => "LOW",
    }
}

fn chunk_text(text: &str, max_chars: usize) -> Vec<String> {
    if max_chars == 0 || text.is_empty() {
        return vec![text.to_string()];
    }

    let mut chunks = Vec::new();
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

pub fn write_notification<W: Write>(
    writer: &mut W,
    method: &str,
    params: Value,
) -> std::io::Result<()> {
    let notification = json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
    });
    let bytes = serde_json::to_vec(&notification)
        .map_err(|err| std::io::Error::new(std::io::ErrorKind::InvalidData, err.to_string()))?;
    write!(writer, "Content-Length: {}\r\n\r\n", bytes.len())?;
    writer.write_all(&bytes)?;
    writer.flush()
}

pub fn write_message<W: Write>(writer: &mut W, payload: &Value) -> std::io::Result<()> {
    let bytes = serde_json::to_vec(payload)
        .map_err(|err| std::io::Error::new(std::io::ErrorKind::InvalidData, err.to_string()))?;
    write!(writer, "Content-Length: {}\r\n\r\n", bytes.len())?;
    writer.write_all(&bytes)?;
    writer.flush()
}
