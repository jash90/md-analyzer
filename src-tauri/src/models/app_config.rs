use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub api_key: String,
    pub model: String,
    pub language: String,
    pub temperature: f64,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            model: "sonar".to_string(),
            language: "pl".to_string(),
            temperature: 0.7,
        }
    }
}
