use serde::{Deserialize, Serialize};
use serde_json::Value;

// ─── Provider 枚举 ───────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum Provider {
    OpenAI,
    Anthropic,
    Google,
    DeepSeek,
}

impl Provider {
    pub fn default_endpoint(&self) -> &'static str {
        match self {
            Provider::OpenAI => "https://api.openai.com/v1/chat/completions",
            Provider::Anthropic => "https://api.anthropic.com/v1/messages",
            Provider::Google => "https://generativelanguage.googleapis.com/v1beta/models",
            Provider::DeepSeek => "https://api.deepseek.com/v1/chat/completions",
        }
    }
}

// ─── 角色枚举 ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Proposer,
    Critic,
    Synthesizer,
    Arbiter,
    Researcher,
    Verifier,
}

impl Role {
    pub fn system_prompt(&self, task: &str) -> String {
        match self {
            Role::Proposer => format!(
                "你是一个方案提出者(Proposer)。针对以下任务，请给出你的初始方案和思路。\n\n任务：{task}"
            ),
            Role::Critic => format!(
                "你是一个批评者(Critic)。请审视其他参与者的方案，指出潜在问题、风险和不足之处。\n\n任务：{task}"
            ),
            Role::Synthesizer => format!(
                "你是一个综合者(Synthesizer)。请综合所有参与者的观点，提炼出共识和分歧点。\n\n任务：{task}"
            ),
            Role::Arbiter => format!(
                "你是一个裁决者(Arbiter)。请基于所有讨论内容，做出最终裁决并给出理由。\n\n任务：{task}"
            ),
            Role::Researcher => format!(
                "你是一个研究者(Researcher)。请补充相关证据和参考资料来支持或反驳现有方案。\n\n任务：{task}"
            ),
            Role::Verifier => format!(
                "你是一个验证者(Verifier)。请验证方案的正确性和可行性。\n\n任务：{task}"
            ),
        }
    }
}

// ─── 参与者 ──────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Participant {
    pub participant_id: String,
    pub role: Role,
    pub provider: Provider,
    pub model_id: String,
    #[serde(default)]
    pub api_key: String,
    #[serde(default)]
    pub endpoint: String,
    #[serde(default = "default_vote_weight")]
    pub vote_weight: f64,
    #[serde(default = "default_priority")]
    pub priority: u32,
}

fn default_vote_weight() -> f64 {
    1.0
}

fn default_priority() -> u32 {
    0
}

// ─── 会议请求 ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeetingRequest {
    pub task: String,
    #[serde(default)]
    pub participants: Vec<Participant>,
    #[serde(default)]
    pub policy: Policy,
    #[serde(default)]
    pub budget: Budget,
    #[serde(default)]
    pub operators: OperatorsConfig,
    #[serde(default)]
    pub review: ReviewPolicy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperatorsConfig {
    #[serde(default = "default_operator_chain")]
    pub chain: Vec<OperatorSpec>,
}

impl Default for OperatorsConfig {
    fn default() -> Self {
        Self {
            chain: default_operator_chain(),
        }
    }
}

fn default_operator_chain() -> Vec<OperatorSpec> {
    vec![
        OperatorSpec::enabled("sanitize_input"),
        OperatorSpec::enabled("context_window"),
        OperatorSpec::enabled("participant_selector"),
        OperatorSpec::enabled("role_response_format"),
        OperatorSpec::enabled("review_instruction"),
        OperatorSpec::enabled("review_findings"),
        OperatorSpec::enabled("output_guard"),
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperatorSpec {
    pub name: String,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default)]
    pub config: Value,
}

impl OperatorSpec {
    pub fn enabled(name: &str) -> Self {
        Self {
            name: name.to_string(),
            enabled: true,
            config: Value::Null,
        }
    }
}

fn default_enabled() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewPolicy {
    #[serde(default = "default_review_enabled")]
    pub enabled: bool,
    #[serde(default = "default_review_language")]
    pub language: String,
    #[serde(default = "default_review_min_severity")]
    pub min_severity: String,
    #[serde(default = "default_review_max_findings")]
    pub max_findings: u32,
    #[serde(default = "default_review_require_evidence")]
    pub require_evidence: bool,
    #[serde(default = "default_review_categories")]
    pub categories: Vec<String>,
}

impl Default for ReviewPolicy {
    fn default() -> Self {
        Self {
            enabled: default_review_enabled(),
            language: default_review_language(),
            min_severity: default_review_min_severity(),
            max_findings: default_review_max_findings(),
            require_evidence: default_review_require_evidence(),
            categories: default_review_categories(),
        }
    }
}

fn default_review_enabled() -> bool {
    true
}

fn default_review_language() -> String {
    "zh-CN".to_string()
}

fn default_review_min_severity() -> String {
    "MEDIUM".to_string()
}

fn default_review_max_findings() -> u32 {
    8
}

fn default_review_require_evidence() -> bool {
    true
}

fn default_review_categories() -> Vec<String> {
    vec![
        "correctness".to_string(),
        "security".to_string(),
        "performance".to_string(),
        "maintainability".to_string(),
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewFinding {
    pub severity: String,
    pub title: String,
    pub evidence: String,
    pub suggestion: String,
    pub source_participant_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewReport {
    pub generated_at_turn: u64,
    pub summary: String,
    pub overall_risk: String,
    pub findings: Vec<ReviewFinding>,
}

impl Default for ReviewReport {
    fn default() -> Self {
        Self {
            generated_at_turn: 0,
            summary: String::new(),
            overall_risk: "LOW".to_string(),
            findings: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Policy {
    #[serde(default = "default_schedule")]
    pub schedule: String,
    #[serde(default = "default_merge")]
    pub merge: String,
    #[serde(default = "default_stop")]
    pub stop: StopPolicy,
}

impl Default for Policy {
    fn default() -> Self {
        Self {
            schedule: default_schedule(),
            merge: default_merge(),
            stop: StopPolicy::default(),
        }
    }
}

fn default_schedule() -> String {
    "parallel_first".to_string()
}

fn default_merge() -> String {
    "weighted_voting".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StopPolicy {
    #[serde(default = "default_max_rounds")]
    pub max_rounds: u32,
    #[serde(default = "default_agreement_threshold")]
    pub agreement_threshold: f64,
    #[serde(default = "default_min_consecutive")]
    pub min_consecutive_agreement: u32,
}

impl Default for StopPolicy {
    fn default() -> Self {
        Self {
            max_rounds: default_max_rounds(),
            agreement_threshold: default_agreement_threshold(),
            min_consecutive_agreement: default_min_consecutive(),
        }
    }
}

fn default_stop() -> StopPolicy {
    StopPolicy::default()
}

fn default_max_rounds() -> u32 {
    3
}

fn default_agreement_threshold() -> f64 {
    0.78
}

fn default_min_consecutive() -> u32 {
    2
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Budget {
    #[serde(default = "default_max_tokens")]
    pub max_tokens: u64,
    #[serde(default = "default_max_cost")]
    pub max_cost: f64,
    #[serde(default = "default_max_rounds_budget")]
    pub max_rounds: u32,
}

impl Default for Budget {
    fn default() -> Self {
        Self {
            max_tokens: default_max_tokens(),
            max_cost: default_max_cost(),
            max_rounds: default_max_rounds_budget(),
        }
    }
}

fn default_max_tokens() -> u64 {
    100_000
}

fn default_max_cost() -> f64 {
    1.0
}

fn default_max_rounds_budget() -> u32 {
    5
}

// ─── 参与者输出 ──────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParticipantOutput {
    pub participant_id: String,
    pub status: String,
    pub content: String,
    pub latency_ms: u64,
    pub tokens_used: TokenUsage,
    pub cost_estimate: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ErrorInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TokenUsage {
    pub prompt_tokens: u64,
    pub completion_tokens: u64,
    pub total_tokens: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorInfo {
    pub code: String,
    pub message: String,
    pub retryable: bool,
}

// ─── 轮次结果 ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TurnResult {
    pub turn_index: u64,
    pub outputs: Vec<ParticipantOutput>,
    pub agreement_score: f64,
}

// ─── 会话状态 ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionState {
    pub session_id: String,
    pub status: String,
    pub current_turn: u64,
    pub turns: Vec<TurnResult>,
    pub total_tokens: u64,
    pub total_cost: f64,
    pub task: String,
    pub participants: Vec<Participant>,
    pub policy: Policy,
    pub budget: Budget,
    pub operators: OperatorsConfig,
    pub review: ReviewPolicy,
    pub last_review: ReviewReport,
    pub history: Vec<ChatMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub participant_id: Option<String>,
}

// ─── JSON-RPC ────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct JsonRpcRequest {
    #[allow(dead_code)]
    pub jsonrpc: Option<String>,
    pub id: Option<Value>,
    pub method: String,
    pub params: Option<Value>,
}

#[derive(Debug, Serialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: &'static str,
    pub id: Value,
    pub result: Value,
}

#[derive(Debug, Serialize)]
pub struct JsonRpcErrorResponse {
    pub jsonrpc: &'static str,
    pub id: Value,
    pub error: JsonRpcError,
}

#[derive(Debug, Serialize)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
}

// ─── API Key 配置 ────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ApiKeys {
    #[serde(default)]
    pub openai: String,
    #[serde(default)]
    pub anthropic: String,
    #[serde(default)]
    pub google: String,
    #[serde(default)]
    pub deepseek: String,
}

impl ApiKeys {
    pub fn get(&self, provider: &Provider) -> &str {
        match provider {
            Provider::OpenAI => &self.openai,
            Provider::Anthropic => &self.anthropic,
            Provider::Google => &self.google,
            Provider::DeepSeek => &self.deepseek,
        }
    }

    /// 从环境变量加载 API Keys
    pub fn from_env() -> Self {
        Self {
            openai: std::env::var("OPENAI_API_KEY").unwrap_or_default(),
            anthropic: std::env::var("ANTHROPIC_API_KEY").unwrap_or_default(),
            google: std::env::var("GOOGLE_API_KEY").unwrap_or_default(),
            deepseek: std::env::var("DEEPSEEK_API_KEY").unwrap_or_default(),
        }
    }
}
