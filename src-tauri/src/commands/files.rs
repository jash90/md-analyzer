use crate::error::AppError;
use crate::models::chat::MarkdownFile;
use std::path::PathBuf;

#[tauri::command]
pub async fn read_markdown_files(paths: Vec<String>) -> Result<Vec<MarkdownFile>, AppError> {
    let mut files = Vec::new();
    for path_str in paths {
        let path = PathBuf::from(&path_str);
        let content = tokio::fs::read_to_string(&path).await?;
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| path_str.clone());
        files.push(MarkdownFile {
            name,
            path: path_str,
            content,
        });
    }
    Ok(files)
}

#[tauri::command]
pub async fn save_markdown_file(
    folder_path: String,
    file_name: String,
    content: String,
) -> Result<String, AppError> {
    let path = PathBuf::from(&folder_path).join(&file_name);
    tokio::fs::write(&path, &content).await?;
    Ok(path.to_string_lossy().to_string())
}
