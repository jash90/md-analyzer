mod commands;
mod error;
mod models;

use commands::files::{read_markdown_files, save_markdown_file};
use commands::perplexity::stream_perplexity_chat;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            read_markdown_files,
            save_markdown_file,
            stream_perplexity_chat,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
