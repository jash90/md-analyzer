use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PerplexityRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct PerplexityChoice {
    pub delta: Option<PerplexityDelta>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PerplexityDelta {
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PerplexityStreamChunk {
    pub choices: Vec<PerplexityChoice>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkdownFile {
    pub name: String,
    pub path: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum StreamEvent {
    Token(String),
    Done(String),
    Error(String),
}
