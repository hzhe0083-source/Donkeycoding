use reqwest::{blocking::Client as BlockingClient, Client};
use rusqlite::{params, Connection};
use serde_json::{json, Value};
use std::cmp::Ordering;
use std::env;
use std::path::PathBuf;
use std::sync::Mutex;

const DEFAULT_EMBED_DIM: usize = 256;
const DEFAULT_TOP_K: usize = 5;
const DEFAULT_MIN_SCORE: f32 = 0.24;
const DEFAULT_MAX_CANDIDATES: usize = 400;

const ENV_MEMORY_ENABLED: &str = "ORCH_MEMORY_ENABLED";
const ENV_MEMORY_BACKEND: &str = "ORCH_MEMORY_BACKEND";
const ENV_MEMORY_NAMESPACE: &str = "ORCH_MEMORY_NAMESPACE";
const ENV_MEMORY_SQLITE_PATH: &str = "ORCH_MEMORY_SQLITE_PATH";
const ENV_MEMORY_TOP_K: &str = "ORCH_MEMORY_TOP_K";
const ENV_MEMORY_MIN_SCORE: &str = "ORCH_MEMORY_MIN_SCORE";
const ENV_MEMORY_MAX_CANDIDATES: &str = "ORCH_MEMORY_MAX_CANDIDATES";
const ENV_MEMORY_EMBED_DIM: &str = "ORCH_MEMORY_EMBED_DIM";

const ENV_MEMORY_EMBED_PROVIDER: &str = "ORCH_MEMORY_EMBED_PROVIDER";
const ENV_MEMORY_EMBED_MODEL: &str = "ORCH_MEMORY_EMBED_MODEL";
const ENV_MEMORY_EMBED_ENDPOINT: &str = "ORCH_MEMORY_EMBED_ENDPOINT";
const ENV_MEMORY_EMBED_API_KEY: &str = "ORCH_MEMORY_EMBED_API_KEY";

const ENV_QDRANT_URL: &str = "ORCH_MEMORY_QDRANT_URL";
const ENV_QDRANT_COLLECTION: &str = "ORCH_MEMORY_QDRANT_COLLECTION";
const ENV_QDRANT_API_KEY: &str = "ORCH_MEMORY_QDRANT_API_KEY";

#[derive(Debug, Clone)]
pub struct MemorySettings {
    pub enabled: bool,
    pub backend: String,
    pub namespace: String,
    pub sqlite_path: String,
    pub top_k: usize,
    pub min_score: f32,
    pub max_candidates: usize,
    pub embed_dim: usize,
    pub embedding: EmbeddingSettings,
    pub qdrant: QdrantSettings,
}

impl MemorySettings {
    pub fn from_env() -> Self {
        let backend = env_string(ENV_MEMORY_BACKEND, "sqlite");
        let enabled = env_bool(ENV_MEMORY_ENABLED, true)
            && !matches!(backend.to_ascii_lowercase().as_str(), "off" | "none" | "disabled");
        let mut embed_dim = env_usize(ENV_MEMORY_EMBED_DIM, DEFAULT_EMBED_DIM)
            .max(64)
            .min(3072);

        let embed_model = env_string(ENV_MEMORY_EMBED_MODEL, "text-embedding-3-small");
        if embed_model.eq_ignore_ascii_case("text-embedding-ada-002") {
            embed_dim = 1536;
        }

        Self {
            enabled,
            backend,
            namespace: env_string(ENV_MEMORY_NAMESPACE, "default"),
            sqlite_path: env_string(ENV_MEMORY_SQLITE_PATH, "orchestrator-memory.db"),
            top_k: env_usize(ENV_MEMORY_TOP_K, DEFAULT_TOP_K).max(1).min(20),
            min_score: env_f32(ENV_MEMORY_MIN_SCORE, DEFAULT_MIN_SCORE)
                .max(0.0)
                .min(1.0),
            max_candidates: env_usize(ENV_MEMORY_MAX_CANDIDATES, DEFAULT_MAX_CANDIDATES)
                .max(50)
                .min(5000),
            embed_dim,
            embedding: EmbeddingSettings::from_env(embed_dim, embed_model),
            qdrant: QdrantSettings::from_env(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct EmbeddingSettings {
    pub provider: String,
    pub model: String,
    pub endpoint: String,
    pub api_key: String,
}

impl EmbeddingSettings {
    fn from_env(default_dim: usize, preselected_model: String) -> Self {
        let provider = env_string(ENV_MEMORY_EMBED_PROVIDER, "hash");
        let endpoint = env_string(ENV_MEMORY_EMBED_ENDPOINT, "https://api.openai.com/v1/embeddings");
        let model = if preselected_model.trim().is_empty() {
            env_string(
                ENV_MEMORY_EMBED_MODEL,
                if default_dim > 1536 {
                    "text-embedding-3-large"
                } else {
                    "text-embedding-3-small"
                },
            )
        } else {
            preselected_model
        };
        let api_key = env_string(
            ENV_MEMORY_EMBED_API_KEY,
            &env::var("OPENAI_API_KEY").unwrap_or_default(),
        );

        Self {
            provider,
            model,
            endpoint,
            api_key,
        }
    }
}

#[derive(Debug, Clone)]
pub struct QdrantSettings {
    pub url: String,
    pub collection: String,
    pub api_key: String,
}

impl QdrantSettings {
    fn from_env() -> Self {
        Self {
            url: env_string(ENV_QDRANT_URL, "http://127.0.0.1:6333"),
            collection: env_string(ENV_QDRANT_COLLECTION, "orchestrator_memory"),
            api_key: env_string(ENV_QDRANT_API_KEY, ""),
        }
    }
}

#[derive(Debug, Clone)]
pub struct MemoryRecord {
    pub session_id: Option<String>,
    pub source: String,
    pub text: String,
}

#[derive(Debug, Clone)]
pub struct MemoryQuery {
    pub namespace: String,
    pub text: String,
    pub top_k: usize,
    pub min_score: f32,
    pub max_candidates: usize,
}

#[derive(Debug, Clone)]
pub struct MemoryHit {
    pub source: String,
    pub text: String,
    pub score: f32,
}

pub trait MemoryStore: Send + Sync {
    fn put(&self, namespace: &str, record: MemoryRecord) -> Result<(), String>;
    fn search(&self, query: &MemoryQuery) -> Result<Vec<MemoryHit>, String>;
}

pub struct NoopMemoryStore;

impl MemoryStore for NoopMemoryStore {
    fn put(&self, _namespace: &str, _record: MemoryRecord) -> Result<(), String> {
        Ok(())
    }

    fn search(&self, _query: &MemoryQuery) -> Result<Vec<MemoryHit>, String> {
        Ok(Vec::new())
    }
}

trait EmbeddingProvider: Send + Sync {
    fn embed(&self, text: &str) -> Result<Vec<f32>, String>;
}

struct HashEmbeddingProvider {
    dim: usize,
}

impl HashEmbeddingProvider {
    fn new(dim: usize) -> Self {
        Self { dim }
    }
}

impl EmbeddingProvider for HashEmbeddingProvider {
    fn embed(&self, text: &str) -> Result<Vec<f32>, String> {
        Ok(embed_text_hash(text, self.dim))
    }
}

struct OpenAiEmbeddingProvider {
    client: BlockingClient,
    endpoint: String,
    model: String,
    api_key: String,
    dimensions: Option<usize>,
}

impl OpenAiEmbeddingProvider {
    fn new(settings: &EmbeddingSettings, dimensions: Option<usize>) -> Self {
        Self {
            client: BlockingClient::new(),
            endpoint: settings.endpoint.trim().to_string(),
            model: settings.model.trim().to_string(),
            api_key: settings.api_key.trim().to_string(),
            dimensions,
        }
    }
}

impl EmbeddingProvider for OpenAiEmbeddingProvider {
    fn embed(&self, text: &str) -> Result<Vec<f32>, String> {
        if self.api_key.is_empty() {
            return Err("embedding provider openai requires api key".to_string());
        }
        if self.endpoint.is_empty() {
            return Err("embedding provider openai requires endpoint".to_string());
        }
        if self.model.is_empty() {
            return Err("embedding provider openai requires model".to_string());
        }

        let endpoint = self.endpoint.clone();
        let body = json!({
            "model": self.model,
            "input": text,
        });

        let body = if let Some(dimensions) = self.dimensions {
            let mut as_obj = body;
            as_obj["dimensions"] = Value::from(dimensions as u64);
            as_obj
        } else {
            body
        };

        let response = self
            .client
            .post(&endpoint)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .map_err(|err| format!("openai embedding request failed: {err}"))?;

        let status = response.status();
        let text_body = response
            .text()
            .map_err(|err| format!("read embedding response failed: {err}"))?;

        if !status.is_success() {
            return Err(format!("embedding api returned {status}: {text_body}"));
        }

        let payload: Value =
            serde_json::from_str(&text_body).map_err(|err| format!("parse embedding json failed: {err}"))?;

        let data = payload
            .get("data")
            .and_then(Value::as_array)
            .and_then(|arr| arr.first())
            .ok_or_else(|| "embedding response missing data[0]".to_string())?;

        let embedding = data
            .get("embedding")
            .and_then(Value::as_array)
            .ok_or_else(|| "embedding response missing embedding".to_string())?;

        let mut vector = Vec::with_capacity(embedding.len());
        for value in embedding {
            let n = value
                .as_f64()
                .ok_or_else(|| "embedding value is not number".to_string())? as f32;
            vector.push(n);
        }

        if vector.is_empty() {
            return Err("embedding vector is empty".to_string());
        }

        normalize(&mut vector);
        Ok(vector)
    }
}

pub struct SqliteMemoryStore {
    conn: Mutex<Connection>,
    embedder: Box<dyn EmbeddingProvider>,
}

impl SqliteMemoryStore {
    fn open(
        path: &str,
        embedder: Box<dyn EmbeddingProvider>,
        _embed_dim: usize,
    ) -> Result<Self, String> {
        let db_path = resolve_db_path(path);
        let conn = Connection::open(&db_path)
            .map_err(|err| format!("open memory sqlite failed: {err}"))?;

        conn.execute_batch(
            "
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            CREATE TABLE IF NOT EXISTS memory_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                namespace TEXT NOT NULL,
                session_id TEXT,
                source TEXT NOT NULL,
                content TEXT NOT NULL,
                embedding BLOB NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_memory_namespace_id
                ON memory_entries(namespace, id DESC);
            ",
        )
        .map_err(|err| format!("init memory sqlite failed: {err}"))?;

        Ok(Self {
            conn: Mutex::new(conn),
            embedder,
        })
    }
}

impl MemoryStore for SqliteMemoryStore {
    fn put(&self, namespace: &str, record: MemoryRecord) -> Result<(), String> {
        if record.text.trim().is_empty() {
            return Ok(());
        }

        let embedding = self.embedder.embed(&record.text)?;
        if embedding.is_empty() {
            return Ok(());
        }

        let blob = encode_embedding(&embedding);
        let created_at = chrono::Utc::now().timestamp();

        let conn = self
            .conn
            .lock()
            .map_err(|_| "memory sqlite lock poisoned".to_string())?;

        conn.execute(
            "
            INSERT INTO memory_entries (namespace, session_id, source, content, embedding, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ",
            params![
                namespace,
                record.session_id,
                record.source,
                record.text,
                blob,
                created_at
            ],
        )
        .map_err(|err| format!("insert memory entry failed: {err}"))?;

        Ok(())
    }

    fn search(&self, query: &MemoryQuery) -> Result<Vec<MemoryHit>, String> {
        let query_text = query.text.trim();
        if query_text.is_empty() {
            return Ok(Vec::new());
        }

        let query_embedding = self.embedder.embed(query_text)?;
        if query_embedding.is_empty() {
            return Ok(Vec::new());
        }

        let conn = self
            .conn
            .lock()
            .map_err(|_| "memory sqlite lock poisoned".to_string())?;

        let mut stmt = conn
            .prepare(
                "
                SELECT source, content, embedding
                FROM memory_entries
                WHERE namespace = ?1
                ORDER BY id DESC
                LIMIT ?2
                ",
            )
            .map_err(|err| format!("prepare memory search failed: {err}"))?;

        let mut rows = stmt
            .query(params![query.namespace, query.max_candidates as i64])
            .map_err(|err| format!("query memory entries failed: {err}"))?;

        let mut hits = Vec::new();
        while let Some(row) = rows
            .next()
            .map_err(|err| format!("iterate memory rows failed: {err}"))?
        {
            let source: String = row
                .get(0)
                .map_err(|err| format!("read memory source failed: {err}"))?;
            let text: String = row
                .get(1)
                .map_err(|err| format!("read memory content failed: {err}"))?;
            let blob: Vec<u8> = row
                .get(2)
                .map_err(|err| format!("read memory embedding failed: {err}"))?;

            let Some(embedding) = decode_embedding(&blob) else {
                continue;
            };

            if embedding.len() != query_embedding.len() {
                continue;
            }

            let score = cosine_similarity(&query_embedding, &embedding);
            if score >= query.min_score {
                hits.push(MemoryHit {
                    source,
                    text,
                    score,
                });
            }
        }

        hits.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));
        hits.truncate(query.top_k);
        Ok(hits)
    }
}

pub struct QdrantMemoryStore {
    client: Client,
    qdrant: QdrantSettings,
    embedder: Box<dyn EmbeddingProvider>,
}

impl QdrantMemoryStore {
    fn open(
        qdrant: QdrantSettings,
        embedder: Box<dyn EmbeddingProvider>,
        embed_dim: usize,
    ) -> Result<Self, String> {
        let client = Client::new();
        let store = Self {
            client,
            qdrant,
            embedder,
        };

        store.ensure_collection(embed_dim)?;
        Ok(store)
    }

    fn ensure_collection(&self, embed_dim: usize) -> Result<(), String> {
        let endpoint = format!(
            "{}/collections/{}",
            self.qdrant.url.trim_end_matches('/'),
            self.qdrant.collection
        );

        let mut request = self.client.put(&endpoint).json(&json!({
            "vectors": {
                "size": embed_dim,
                "distance": "Cosine"
            }
        }));

        if !self.qdrant.api_key.is_empty() {
            request = request.header("api-key", self.qdrant.api_key.clone());
        }

        let response = tokio::runtime::Handle::current()
            .block_on(async { request.send().await })
            .map_err(|err| format!("qdrant ensure collection request failed: {err}"))?;

        let status = response.status();
        let body = tokio::runtime::Handle::current()
            .block_on(async { response.text().await })
            .map_err(|err| format!("qdrant ensure collection read failed: {err}"))?;

        if status.is_success() {
            return Ok(());
        }

        if status.as_u16() == 409 {
            return Ok(());
        }

        Err(format!(
            "qdrant ensure collection failed: status={status}, body={body}"
        ))
    }

    fn qdrant_with_key(&self, request: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        if self.qdrant.api_key.is_empty() {
            request
        } else {
            request.header("api-key", self.qdrant.api_key.clone())
        }
    }
}

impl MemoryStore for QdrantMemoryStore {
    fn put(&self, namespace: &str, record: MemoryRecord) -> Result<(), String> {
        if record.text.trim().is_empty() {
            return Ok(());
        }

        let vector = self.embedder.embed(&record.text)?;
        if vector.is_empty() {
            return Ok(());
        }

        let endpoint = format!(
            "{}/collections/{}/points",
            self.qdrant.url.trim_end_matches('/'),
            self.qdrant.collection
        );

        let payload = json!({
            "points": [
                {
                    "id": uuid::Uuid::new_v4().to_string(),
                    "vector": vector,
                    "payload": {
                        "namespace": namespace,
                        "session_id": record.session_id,
                        "source": record.source,
                        "content": record.text,
                        "created_at": chrono::Utc::now().timestamp(),
                    }
                }
            ]
        });

        let request = self.qdrant_with_key(self.client.put(&endpoint).json(&payload));
        let response = tokio::runtime::Handle::current()
            .block_on(async { request.send().await })
            .map_err(|err| format!("qdrant upsert request failed: {err}"))?;
        let status = response.status();
        let body = tokio::runtime::Handle::current()
            .block_on(async { response.text().await })
            .map_err(|err| format!("qdrant upsert read body failed: {err}"))?;

        if status.is_success() {
            return Ok(());
        }

        Err(format!("qdrant upsert failed: status={status}, body={body}"))
    }

    fn search(&self, query: &MemoryQuery) -> Result<Vec<MemoryHit>, String> {
        let query_text = query.text.trim();
        if query_text.is_empty() {
            return Ok(Vec::new());
        }

        let vector = self.embedder.embed(query_text)?;
        if vector.is_empty() {
            return Ok(Vec::new());
        }

        let endpoint = format!(
            "{}/collections/{}/points/search",
            self.qdrant.url.trim_end_matches('/'),
            self.qdrant.collection
        );

        let payload = json!({
            "vector": vector,
            "limit": query.top_k,
            "with_payload": true,
            "score_threshold": query.min_score,
            "filter": {
                "must": [
                    {
                        "key": "namespace",
                        "match": { "value": query.namespace }
                    }
                ]
            }
        });

        let request = self.qdrant_with_key(self.client.post(&endpoint).json(&payload));
        let response = tokio::runtime::Handle::current()
            .block_on(async { request.send().await })
            .map_err(|err| format!("qdrant search request failed: {err}"))?;
        let status = response.status();
        let body = tokio::runtime::Handle::current()
            .block_on(async { response.text().await })
            .map_err(|err| format!("qdrant search read body failed: {err}"))?;

        if !status.is_success() {
            return Err(format!("qdrant search failed: status={status}, body={body}"));
        }

        let payload: Value =
            serde_json::from_str(&body).map_err(|err| format!("parse qdrant search body failed: {err}"))?;

        let result = payload
            .get("result")
            .and_then(Value::as_array)
            .ok_or_else(|| "qdrant search response missing result array".to_string())?;

        let mut hits = Vec::new();
        for item in result {
            let score = item.get("score").and_then(Value::as_f64).unwrap_or(0.0) as f32;
            let payload = item.get("payload").unwrap_or(&Value::Null);
            let source = payload
                .get("source")
                .and_then(Value::as_str)
                .unwrap_or("unknown")
                .to_string();
            let text = payload
                .get("content")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string();

            if !text.trim().is_empty() {
                hits.push(MemoryHit { source, text, score });
            }
        }

        hits.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(Ordering::Equal));
        hits.truncate(query.top_k);
        Ok(hits)
    }
}

pub fn build_memory_store(settings: &MemorySettings) -> Result<Box<dyn MemoryStore>, String> {
    if !settings.enabled {
        return Ok(Box::new(NoopMemoryStore));
    }

    let embedder = build_embedding_provider(settings)?;

    match settings.backend.to_ascii_lowercase().as_str() {
        "sqlite" => Ok(Box::new(SqliteMemoryStore::open(
            &settings.sqlite_path,
            embedder,
            settings.embed_dim,
        )?)),
        "qdrant" => Ok(Box::new(QdrantMemoryStore::open(
            settings.qdrant.clone(),
            embedder,
            settings.embed_dim,
        )?)),
        other => Err(format!("unsupported memory backend: {other}")),
    }
}

fn build_embedding_provider(settings: &MemorySettings) -> Result<Box<dyn EmbeddingProvider>, String> {
    match settings.embedding.provider.to_ascii_lowercase().as_str() {
        "hash" => Ok(Box::new(HashEmbeddingProvider::new(settings.embed_dim))),
        "openai" => {
            let model = settings.embedding.model.to_ascii_lowercase();
            let dimensions = if model.contains("text-embedding-3") {
                Some(settings.embed_dim)
            } else {
                None
            };
            Ok(Box::new(OpenAiEmbeddingProvider::new(
                &settings.embedding,
                dimensions,
            )))
        }
        other => Err(format!("unsupported embedding provider: {other}")),
    }
}

fn resolve_db_path(path: &str) -> String {
    let candidate = PathBuf::from(path);
    if candidate.is_absolute() {
        return candidate.to_string_lossy().to_string();
    }

    let cwd = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    cwd.join(candidate).to_string_lossy().to_string()
}

fn tokenize(text: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();

    for ch in text.chars() {
        if ch.is_alphanumeric() {
            for lower in ch.to_lowercase() {
                current.push(lower);
            }
        } else if !current.is_empty() {
            tokens.push(std::mem::take(&mut current));
        }
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    tokens
}

fn fnv1a_64(input: &str) -> u64 {
    const FNV_OFFSET: u64 = 14695981039346656037;
    const FNV_PRIME: u64 = 1099511628211;

    let mut hash = FNV_OFFSET;
    for byte in input.as_bytes() {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(FNV_PRIME);
    }
    hash
}

fn embed_text_hash(text: &str, dim: usize) -> Vec<f32> {
    let tokens = tokenize(text);
    if tokens.is_empty() || dim == 0 {
        return Vec::new();
    }

    let mut vec = vec![0.0_f32; dim];
    for token in tokens {
        let index = (fnv1a_64(&token) % dim as u64) as usize;
        vec[index] += 1.0;
    }

    normalize(&mut vec);
    vec
}

fn normalize(vec: &mut [f32]) {
    let mut norm = 0.0_f32;
    for value in vec.iter() {
        norm += value * value;
    }
    norm = norm.sqrt();

    if norm <= f32::EPSILON {
        return;
    }

    for value in vec.iter_mut() {
        *value /= norm;
    }
}

fn cosine_similarity(left: &[f32], right: &[f32]) -> f32 {
    let mut sum = 0.0_f32;
    for (l, r) in left.iter().zip(right.iter()) {
        sum += l * r;
    }
    sum
}

fn encode_embedding(values: &[f32]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(values.len() * 4);
    for value in values {
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    bytes
}

fn decode_embedding(bytes: &[u8]) -> Option<Vec<f32>> {
    if bytes.is_empty() || bytes.len() % 4 != 0 {
        return None;
    }

    let mut values = Vec::with_capacity(bytes.len() / 4);
    for chunk in bytes.chunks_exact(4) {
        let array = [chunk[0], chunk[1], chunk[2], chunk[3]];
        values.push(f32::from_le_bytes(array));
    }
    Some(values)
}

fn env_string(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}

fn env_bool(key: &str, default: bool) -> bool {
    match env::var(key) {
        Ok(raw) => matches!(
            raw.trim().to_ascii_lowercase().as_str(),
            "1" | "true" | "yes" | "on"
        ),
        Err(_) => default,
    }
}

fn env_usize(key: &str, default: usize) -> usize {
    env::var(key)
        .ok()
        .and_then(|raw| raw.trim().parse::<usize>().ok())
        .unwrap_or(default)
}

fn env_f32(key: &str, default: f32) -> f32 {
    env::var(key)
        .ok()
        .and_then(|raw| raw.trim().parse::<f32>().ok())
        .unwrap_or(default)
}
