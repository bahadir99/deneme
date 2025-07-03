// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
//use std::path::PathBuf;
use tauri::path;
use tauri::AppHandle;
use tauri::Manager;

#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn save_story(app: AppHandle, story_json: String) -> Result<(), String> {
    let app_dir = path::PathResolver::app_data_dir(&app.path()).map_err(|e| e.to_string())?;
    let file_path = app_dir.join("story.json");
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    fs::write(&file_path, story_json).map_err(|e| e.to_string())?;
    println!("Saving story to: {:?}", file_path);
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, exit_app, save_story])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
