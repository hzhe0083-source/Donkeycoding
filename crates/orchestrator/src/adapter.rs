use crate::types::*;
use reqwest::Client;
use serde_json::{json, Value};
use std::error::Error;
use std::time::Duration;
use std::time::Instant;

fn format_error_chain(error: &dyn Error) -> String {
    let mut parts = Vec::new();
    parts.push(error.to_string());
    let mut current = error.source();
    while let Some(next) = current {
        parts.push(next.to_string());
        current = next.source();
    }
    parts.join(" | caused_by: ")
}

/// 统一的 LLM 调用接口
pub struct LlmAdapter {
    client: Client,
    api_keys: ApiKeys,
}

impl LlmAdapter {
    pub fn new(api_keys: ApiKeys) -> Self {
        let client = Client::builder()
            .http1_only()
            .connect_timeout(Duration::from_secs(20))
            .timeout(Duration::from_secs(170))
            .pool_idle_timeout(Duration::from_secs(30))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            api_keys,
        }
    }

    /// 更新 API Keys（来自前端 config/setKeys 请求）
    pub fn set_api_keys(&mut self, keys: ApiKeys) {
        self.api_keys = keys;
    }

    /// 获取当前 API Keys 引用
    pub fn api_keys(&self) -> &ApiKeys {
        &self.api_keys
    }

    /// 调用 LLM 并返回结果
    pub async fn call(
        &self,
        participant: &Participant,
        messages: &[ChatMessage],
    ) -> ParticipantOutput {
        let start = Instant::now();

        // 优先使用参与者自带的 key，否则用全局 key
        let api_key = if !participant.api_key.is_empty() {
            participant.api_key.clone()
        } else {
            self.api_keys.get(&participant.provider).to_string()
        };

        if api_key.is_empty() {
            return ParticipantOutput {
                participant_id: participant.participant_id.clone(),
                status: "error".to_string(),
                content: String::new(),
                latency_ms: start.elapsed().as_millis() as u64,
                tokens_used: TokenUsage::default(),
                cost_estimate: 0.0,
                error: Some(ErrorInfo {
                    code: "NO_API_KEY".to_string(),
                    message: format!(
                        "No API key configured for provider {:?}. Set env var or pass api_key in participant config.",
                        participant.provider
                    ),
                    retryable: false,
                }),
            };
        }

        let result = match participant.provider {
            Provider::OpenAI | Provider::OpenAICompatible | Provider::DeepSeek => {
                self.call_openai_compatible(participant, &api_key, messages)
                    .await
            }
            Provider::Anthropic => self.call_anthropic(participant, &api_key, messages).await,
            Provider::Google => self.call_google(participant, &api_key, messages).await,
        };

        let latency_ms = start.elapsed().as_millis() as u64;

        match result {
            Ok((content, usage)) => {
                let cost = estimate_cost(&participant.provider, &participant.model_id, &usage);
                ParticipantOutput {
                    participant_id: participant.participant_id.clone(),
                    status: "success".to_string(),
                    content,
                    latency_ms,
                    tokens_used: usage,
                    cost_estimate: cost,
                    error: None,
                }
            }
            Err(err) => ParticipantOutput {
                participant_id: participant.participant_id.clone(),
                status: "error".to_string(),
                content: String::new(),
                latency_ms,
                tokens_used: TokenUsage::default(),
                cost_estimate: 0.0,
                error: Some(ErrorInfo {
                    code: "API_ERROR".to_string(),
                    message: err,
                    retryable: true,
                }),
            },
        }
    }

    /// OpenAI / DeepSeek 兼容接口
    async fn call_openai_compatible(
        &self,
        participant: &Participant,
        api_key: &str,
        messages: &[ChatMessage],
    ) -> Result<(String, TokenUsage), String> {
        let mut endpoint = if !participant.endpoint.is_empty() {
            participant.endpoint.clone()
        } else {
            participant.provider.default_endpoint().to_string()
        };

        // 兼容 Roo Code / OpenAI 风格的 Base URL：
        // 用户可能填写 "https://example.com/v1" 或 "https://example.com/v1/"
        // 需要自动拼接 "/chat/completions"
        if endpoint.ends_with('/') {
            endpoint.pop();
        }
        if !endpoint.ends_with("/chat/completions") {
            endpoint = format!("{endpoint}/chat/completions");
        }

        let api_messages: Vec<Value> = messages
            .iter()
            .map(|m| {
                json!({
                    "role": m.role,
                    "content": m.content,
                })
            })
            .collect();

        let body = json!({
            "model": participant.model_id,
            "messages": api_messages,
            "max_tokens": 4096,
            "temperature": 0.7,
        });

        let response = self
            .client
            .post(&endpoint)
            .header("Authorization", format!("Bearer {api_key}"))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| {
                let chain = format_error_chain(&e);
                format!(
                    "HTTP request failed: {e}; endpoint={endpoint}; model={}; debug={e:?}; chain={chain}",
                    participant.model_id,
                )
            })?;

        let status = response.status();
        let text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {e}"))?;

        if !status.is_success() {
            return Err(format!("API returned {status}: {text}"));
        }

        let json: Value =
            serde_json::from_str(&text).map_err(|e| {
                let preview = if text.len() > 200 { &text[..200] } else { &text };
                format!("Failed to parse JSON: {e}; endpoint={endpoint}; body_preview={preview}")
            })?;

        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = TokenUsage {
            prompt_tokens: json["usage"]["prompt_tokens"].as_u64().unwrap_or(0),
            completion_tokens: json["usage"]["completion_tokens"].as_u64().unwrap_or(0),
            total_tokens: json["usage"]["total_tokens"].as_u64().unwrap_or(0),
        };

        Ok((content, usage))
    }

    /// Anthropic Messages API
    async fn call_anthropic(
        &self,
        participant: &Participant,
        api_key: &str,
        messages: &[ChatMessage],
    ) -> Result<(String, TokenUsage), String> {
        let mut endpoint = if !participant.endpoint.is_empty() {
            participant.endpoint.clone()
        } else {
            participant.provider.default_endpoint().to_string()
        };

        if endpoint.ends_with('/') {
            endpoint.pop();
        }
        if !endpoint.ends_with("/v1/messages") {
            endpoint = format!("{endpoint}/v1/messages");
        }

        // Anthropic 需要把 system 消息单独提取
        let system_content: String = messages
            .iter()
            .filter(|m| m.role == "system")
            .map(|m| m.content.as_str())
            .collect::<Vec<_>>()
            .join("\n\n");

        let api_messages: Vec<Value> = messages
            .iter()
            .filter(|m| m.role != "system")
            .map(|m| {
                json!({
                    "role": if m.role == "assistant" { "assistant" } else { "user" },
                    "content": m.content,
                })
            })
            .collect();

        let mut body = json!({
            "model": participant.model_id,
            "messages": api_messages,
            "max_tokens": 4096,
        });

        if !system_content.is_empty() {
            body["system"] = Value::String(system_content);
        }

        eprintln!(
            "[adapter] call_anthropic: endpoint={}, model={}, participant={}, messages_count={}",
            endpoint, participant.model_id, participant.participant_id, messages.len()
        );

        let response = self
            .client
            .post(&endpoint)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| {
                let chain = format_error_chain(&e);
                format!(
                    "HTTP request failed: {e}; endpoint={endpoint}; model={}; debug={e:?}; chain={chain}",
                    participant.model_id,
                )
            })?;

        let status = response.status();
        let text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {e}"))?;

        if !status.is_success() {
            return Err(format!("API returned {status}: {text}"));
        }

        let json: Value =
            serde_json::from_str(&text).map_err(|e| {
                let preview = if text.len() > 200 { &text[..200] } else { &text };
                format!("Failed to parse JSON: {e}; endpoint={endpoint}; body_preview={preview}")
            })?;

        let content = json["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = TokenUsage {
            prompt_tokens: json["usage"]["input_tokens"].as_u64().unwrap_or(0),
            completion_tokens: json["usage"]["output_tokens"].as_u64().unwrap_or(0),
            total_tokens: json["usage"]["input_tokens"].as_u64().unwrap_or(0)
                + json["usage"]["output_tokens"].as_u64().unwrap_or(0),
        };

        Ok((content, usage))
    }

    /// Google Gemini API
    async fn call_google(
        &self,
        participant: &Participant,
        api_key: &str,
        messages: &[ChatMessage],
    ) -> Result<(String, TokenUsage), String> {
        let endpoint = if !participant.endpoint.is_empty() {
            participant.endpoint.clone()
        } else {
            format!(
                "{}{}:generateContent?key={}",
                participant.provider.default_endpoint(),
                participant.model_id,
                api_key
            )
        };

        // Google Gemini 格式：system instruction + contents
        let system_content: String = messages
            .iter()
            .filter(|m| m.role == "system")
            .map(|m| m.content.as_str())
            .collect::<Vec<_>>()
            .join("\n\n");

        let contents: Vec<Value> = messages
            .iter()
            .filter(|m| m.role != "system")
            .map(|m| {
                json!({
                    "role": if m.role == "assistant" { "model" } else { "user" },
                    "parts": [{ "text": m.content }],
                })
            })
            .collect();

        let mut body = json!({
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": 4096,
                "temperature": 0.7,
            },
        });

        if !system_content.is_empty() {
            body["systemInstruction"] = json!({
                "parts": [{ "text": system_content }],
            });
        }

        let response = self
            .client
            .post(&endpoint)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("HTTP request failed: {e}"))?;

        let status = response.status();
        let text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {e}"))?;

        if !status.is_success() {
            return Err(format!("API returned {status}: {text}"));
        }

        let json: Value =
            serde_json::from_str(&text).map_err(|e| {
                let preview = if text.len() > 200 { &text[..200] } else { &text };
                format!("Failed to parse JSON: {e}; endpoint={endpoint}; body_preview={preview}")
            })?;

        let content = json["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = TokenUsage {
            prompt_tokens: json["usageMetadata"]["promptTokenCount"]
                .as_u64()
                .unwrap_or(0),
            completion_tokens: json["usageMetadata"]["candidatesTokenCount"]
                .as_u64()
                .unwrap_or(0),
            total_tokens: json["usageMetadata"]["totalTokenCount"]
                .as_u64()
                .unwrap_or(0),
        };

        Ok((content, usage))
    }
}

/// 粗略估算成本（USD）
fn estimate_cost(provider: &Provider, model_id: &str, usage: &TokenUsage) -> f64 {
    let (input_rate, output_rate) = match provider {
        Provider::OpenAI | Provider::OpenAICompatible => match model_id {
            m if m.contains("gpt-4") => (0.03 / 1000.0, 0.06 / 1000.0),
            m if m.contains("gpt-3.5") => (0.0005 / 1000.0, 0.0015 / 1000.0),
            _ => (0.01 / 1000.0, 0.03 / 1000.0),
        },
        Provider::Anthropic => match model_id {
            m if m.contains("opus") => (0.015 / 1000.0, 0.075 / 1000.0),
            m if m.contains("sonnet") => (0.003 / 1000.0, 0.015 / 1000.0),
            m if m.contains("haiku") => (0.00025 / 1000.0, 0.00125 / 1000.0),
            _ => (0.003 / 1000.0, 0.015 / 1000.0),
        },
        Provider::Google => (0.00025 / 1000.0, 0.0005 / 1000.0),
        Provider::DeepSeek => (0.00014 / 1000.0, 0.00028 / 1000.0),
    };

    (usage.prompt_tokens as f64 * input_rate) + (usage.completion_tokens as f64 * output_rate)
}
