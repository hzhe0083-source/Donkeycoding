use crate::types::*;
use serde_json::Value;
use std::cmp::Ordering;
use std::collections::HashMap;

pub struct TurnContext {
    pub task: String,
    pub user_message: String,
    pub history: Vec<ChatMessage>,
    pub participants: Vec<Participant>,
    pub prompt_suffix_by_participant: HashMap<String, String>,
    pub outputs: Vec<ParticipantOutput>,
    pub trace: Vec<String>,
}

impl TurnContext {
    pub fn new(
        task: String,
        user_message: String,
        history: Vec<ChatMessage>,
        participants: Vec<Participant>,
    ) -> Self {
        Self {
            task,
            user_message,
            history,
            participants,
            prompt_suffix_by_participant: HashMap::new(),
            outputs: Vec::new(),
            trace: Vec::new(),
        }
    }

    pub fn system_prompt_for(&self, participant: &Participant) -> String {
        let mut prompt = participant.role.system_prompt(&self.task);
        if let Some(suffix) = self
            .prompt_suffix_by_participant
            .get(&participant.participant_id)
        {
            if !suffix.trim().is_empty() {
                prompt.push_str("\n\n");
                prompt.push_str(suffix);
            }
        }
        prompt
    }
}

pub trait TurnOperator: Send + Sync {
    fn name(&self) -> &'static str;
    fn apply_before(&self, _ctx: &mut TurnContext, _config: &Value) {}
    fn apply_after(&self, _ctx: &mut TurnContext, _config: &Value) {}
}

pub struct OperatorRegistry {
    operators: HashMap<String, Box<dyn TurnOperator>>,
}

impl OperatorRegistry {
    pub fn new() -> Self {
        let mut registry = Self {
            operators: HashMap::new(),
        };
        registry.register(SanitizeInputOperator);
        registry.register(ContextWindowOperator);
        registry.register(ParticipantSelectorOperator);
        registry.register(RoleResponseFormatOperator);
        registry.register(ReviewInstructionOperator);
        registry.register(ReviewFindingsNormalizerOperator);
        registry.register(OutputGuardOperator);
        registry
    }

    fn register<T: TurnOperator + 'static>(&mut self, operator: T) {
        self.operators
            .insert(operator.name().to_string(), Box::new(operator));
    }

    pub fn apply_before(&self, chain: &[OperatorSpec], ctx: &mut TurnContext) {
        for spec in chain {
            if !spec.enabled {
                continue;
            }

            if let Some(operator) = self.operators.get(&spec.name) {
                operator.apply_before(ctx, &spec.config);
                ctx.trace.push(format!("before:{}", spec.name));
            } else {
                ctx.trace.push(format!("missing:{}", spec.name));
            }
        }
    }

    pub fn apply_after(&self, chain: &[OperatorSpec], ctx: &mut TurnContext) {
        for spec in chain {
            if !spec.enabled {
                continue;
            }

            if let Some(operator) = self.operators.get(&spec.name) {
                operator.apply_after(ctx, &spec.config);
                ctx.trace.push(format!("after:{}", spec.name));
            }
        }
    }
}

fn config_bool(config: &Value, key: &str, default: bool) -> bool {
    config.get(key).and_then(Value::as_bool).unwrap_or(default)
}

fn config_usize(config: &Value, key: &str, default: usize) -> usize {
    config
        .get(key)
        .and_then(Value::as_u64)
        .map(|v| v as usize)
        .unwrap_or(default)
}

fn config_str_list(config: &Value, key: &str) -> Vec<String> {
    config
        .get(key)
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(Value::as_str)
                .map(|v| v.to_lowercase())
                .collect()
        })
        .unwrap_or_default()
}

fn normalize_message(input: &str) -> String {
    let mut lines = Vec::new();
    let mut last_empty = false;

    for raw in input.lines() {
        let trimmed = raw.trim();
        if trimmed.is_empty() {
            if !last_empty {
                lines.push(String::new());
            }
            last_empty = true;
        } else {
            lines.push(trimmed.to_string());
            last_empty = false;
        }
    }

    lines.join("\n").trim().to_string()
}

struct SanitizeInputOperator;

impl TurnOperator for SanitizeInputOperator {
    fn name(&self) -> &'static str {
        "sanitize_input"
    }

    fn apply_before(&self, ctx: &mut TurnContext, config: &Value) {
        let normalize = config_bool(config, "normalize_whitespace", true);
        let max_chars = config_usize(config, "max_chars", 4000);

        let mut message = ctx.user_message.trim().to_string();
        if normalize {
            message = normalize_message(&message);
        }

        if message.chars().count() > max_chars {
            message = message.chars().take(max_chars).collect();
        }

        if message.trim().is_empty() {
            message = "请基于上下文继续讨论。".to_string();
        }

        ctx.user_message = message.clone();
        if let Some(last) = ctx.history.last_mut() {
            if last.role == "user" && last.participant_id.is_none() {
                last.content = message;
            }
        }
    }
}

struct ContextWindowOperator;

impl TurnOperator for ContextWindowOperator {
    fn name(&self) -> &'static str {
        "context_window"
    }

    fn apply_before(&self, ctx: &mut TurnContext, config: &Value) {
        let max_messages = config_usize(config, "max_messages", 24).max(1);
        let max_chars = config_usize(config, "max_chars", 12000).max(1);

        if ctx.history.len() > max_messages {
            let keep_from = ctx.history.len() - max_messages;
            ctx.history = ctx.history.split_off(keep_from);
        }

        let mut picked = Vec::new();
        let mut total_chars = 0usize;
        for message in ctx.history.iter().rev() {
            let len = message.content.chars().count();
            if !picked.is_empty() && total_chars + len > max_chars {
                break;
            }
            total_chars += len;
            picked.push(message.clone());
        }
        picked.reverse();

        if !picked.is_empty() {
            ctx.history = picked;
        }
    }
}

struct ParticipantSelectorOperator;

impl TurnOperator for ParticipantSelectorOperator {
    fn name(&self) -> &'static str {
        "participant_selector"
    }

    fn apply_before(&self, ctx: &mut TurnContext, config: &Value) {
        let max_participants = config_usize(config, "max_participants", 3).max(1);
        let role_allowlist = config_str_list(config, "role_allowlist");
        let provider_allowlist = config_str_list(config, "provider_allowlist");

        let mut filtered: Vec<Participant> = ctx
            .participants
            .iter()
            .filter(|participant| {
                let role_ok = if role_allowlist.is_empty() {
                    true
                } else {
                    role_allowlist.contains(&format!("{:?}", participant.role).to_lowercase())
                };

                let provider_ok = if provider_allowlist.is_empty() {
                    true
                } else {
                    provider_allowlist
                        .contains(&format!("{:?}", participant.provider).to_lowercase())
                };

                role_ok && provider_ok
            })
            .cloned()
            .collect();

        if filtered.is_empty() {
            filtered = ctx.participants.clone();
        }

        filtered.sort_by(|left, right| match left.priority.cmp(&right.priority) {
            Ordering::Equal => right
                .vote_weight
                .partial_cmp(&left.vote_weight)
                .unwrap_or(Ordering::Equal),
            other => other,
        });

        if filtered.len() > max_participants {
            filtered.truncate(max_participants);
        }

        ctx.participants = filtered;
    }
}

struct RoleResponseFormatOperator;

impl TurnOperator for RoleResponseFormatOperator {
    fn name(&self) -> &'static str {
        "role_response_format"
    }

    fn apply_before(&self, ctx: &mut TurnContext, config: &Value) {
        let include_checklist = config_bool(config, "include_checklist", true);
        let json_mode = config_bool(config, "json_mode", false);

        for participant in &ctx.participants {
            let mut suffix = String::new();

            if include_checklist {
                let checklist = match participant.role {
                    Role::Proposer => "请按以下结构输出：\n1) 方案要点\n2) 实施步骤\n3) 主要风险",
                    Role::Critic => "请按以下结构输出：\n1) 问题清单\n2) 风险等级\n3) 修正建议",
                    Role::Synthesizer => "请按以下结构输出：\n1) 共识\n2) 分歧\n3) 折中方案",
                    Role::Arbiter => "请按以下结构输出：\n1) 最终结论\n2) 决策依据\n3) 后续动作",
                    Role::Researcher => "请按以下结构输出：\n1) 证据\n2) 可信度\n3) 对方案影响",
                    Role::Verifier => "请按以下结构输出：\n1) 校验结论\n2) 边界条件\n3) 待补充项",
                };
                suffix.push_str(checklist);
            }

            if json_mode {
                if !suffix.is_empty() {
                    suffix.push_str("\n\n");
                }
                suffix.push_str("输出 JSON 对象，字段：summary, steps, risks, confidence。");
            }

            if !suffix.is_empty() {
                ctx.prompt_suffix_by_participant
                    .insert(participant.participant_id.clone(), suffix);
            }
        }
    }
}

struct OutputGuardOperator;

impl TurnOperator for OutputGuardOperator {
    fn name(&self) -> &'static str {
        "output_guard"
    }

    fn apply_after(&self, ctx: &mut TurnContext, config: &Value) {
        let min_chars = config_usize(config, "min_chars", 8).max(1);

        for output in &mut ctx.outputs {
            if output.status == "success" && output.content.trim().chars().count() < min_chars {
                output.status = "error".to_string();
                output.content.clear();
                output.error = Some(ErrorInfo {
                    code: "OUTPUT_TOO_SHORT".to_string(),
                    message: format!(
                        "Model output is shorter than {min_chars} chars and is rejected by output_guard"
                    ),
                    retryable: true,
                });
                output.tokens_used = TokenUsage::default();
                output.cost_estimate = 0.0;
            }
        }
    }
}

struct ReviewInstructionOperator;

impl TurnOperator for ReviewInstructionOperator {
    fn name(&self) -> &'static str {
        "review_instruction"
    }

    fn apply_before(&self, ctx: &mut TurnContext, config: &Value) {
        let include_severity = config_bool(config, "include_severity", true);
        let include_evidence = config_bool(config, "include_evidence", true);

        for participant in &ctx.participants {
            let mut suffix = ctx
                .prompt_suffix_by_participant
                .get(&participant.participant_id)
                .cloned()
                .unwrap_or_default();

            if !suffix.is_empty() {
                suffix.push_str("\n\n");
            }

            suffix.push_str("你正在执行代码审核任务。请优先给出可执行、可验证的问题与修复建议。");

            if include_severity {
                suffix.push_str("\n每条问题都要标注严重级别：LOW/MEDIUM/HIGH/CRITICAL。");
            }

            if include_evidence {
                suffix.push_str("\n每条问题都需要给出证据（代码片段、行为说明或复现线索）。");
            }

            suffix.push_str("\n输出建议格式：- [SEVERITY] title | evidence | suggestion");

            ctx.prompt_suffix_by_participant
                .insert(participant.participant_id.clone(), suffix);
        }
    }
}

struct ReviewFindingsNormalizerOperator;

impl TurnOperator for ReviewFindingsNormalizerOperator {
    fn name(&self) -> &'static str {
        "review_findings"
    }

    fn apply_after(&self, ctx: &mut TurnContext, config: &Value) {
        let add_prefix = config_bool(config, "add_prefix", true);

        for output in &mut ctx.outputs {
            if output.status != "success" || output.content.trim().is_empty() {
                continue;
            }

            let mut normalized = normalize_message(&output.content);

            if add_prefix {
                normalized = format!("[review:{}]\n{}", output.participant_id, normalized);
            }

            output.content = normalized;
        }
    }
}
