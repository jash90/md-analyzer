use crate::error::AppError;
use crate::models::chat::{ChatMessage, PerplexityRequest, PerplexityStreamChunk, StreamEvent};
use futures_util::StreamExt;
use tauri::ipc::Channel;

#[tauri::command]
pub async fn stream_perplexity_chat(
    api_key: String,
    model: String,
    messages: Vec<ChatMessage>,
    temperature: Option<f64>,
    on_event: Channel<StreamEvent>,
) -> Result<(), AppError> {
    let client = reqwest::Client::new();

    let request_body = PerplexityRequest {
        model,
        messages,
        stream: true,
        temperature,
    };

    let response = client
        .post("https://api.perplexity.ai/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        let err_msg = format!("API returned {}: {}", status, body);
        let _ = on_event.send(StreamEvent::Error(err_msg.clone()));
        return Err(AppError::Api(err_msg));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut full_content = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        // Process all complete lines in the buffer.
        // SSE lines are separated by \n (with optional \r).
        // We keep processing as long as there's a newline in the buffer.
        loop {
            let Some(pos) = buffer.find('\n') else {
                break;
            };

            let line = buffer[..pos].trim_end_matches('\r').to_string();
            buffer = buffer[pos + 1..].to_string();

            // Skip empty lines and SSE comments
            if line.is_empty() || line.starts_with(':') {
                continue;
            }

            let Some(data) = line.strip_prefix("data:") else {
                continue;
            };

            let data = data.trim();
            if data == "[DONE]" {
                let _ = on_event.send(StreamEvent::Done(full_content.clone()));
                return Ok(());
            }

            if data.is_empty() {
                continue;
            }

            match serde_json::from_str::<PerplexityStreamChunk>(data) {
                Ok(parsed) => {
                    for choice in &parsed.choices {
                        if let Some(delta) = &choice.delta {
                            if let Some(content) = &delta.content {
                                if !content.is_empty() {
                                    full_content.push_str(content);
                                    let _ =
                                        on_event.send(StreamEvent::Token(content.clone()));
                                }
                            }
                        }
                    }
                }
                Err(_) => {
                    // Skip unparseable chunks
                }
            }
        }
    }

    // Stream ended without [DONE] — still finalize
    if !full_content.is_empty() {
        let _ = on_event.send(StreamEvent::Done(full_content));
    } else {
        let _ = on_event.send(StreamEvent::Done(String::new()));
    }
    Ok(())
}
