// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use sanitize_filename;
use std::fs;
use std::io;
use std::path::PathBuf;
use tauri::path;
use tauri::AppHandle;
use tauri::Manager;

#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn save_story(app: AppHandle, title: String, story_json: String) -> Result<(), String> {
    let app_dir = path::PathResolver::app_data_dir(&app.path()).map_err(|e| e.to_string())?;
    let stories_dir = app_dir.join("stories");
    std::fs::create_dir_all(&stories_dir).map_err(|e| e.to_string())?;
    let safe_title = sanitize_filename::sanitize(&title);
    let file_path = stories_dir.join(format!("{}.json", safe_title));
    std::fs::write(&file_path, story_json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn list_stories(app: AppHandle) -> Result<Vec<String>, String> {
    let app_dir = path::PathResolver::app_data_dir(&app.path()).map_err(|e| e.to_string())?;
    let stories_dir = app_dir.join("stories");
    let mut stories = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&stories_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                        stories.push(name.to_string());
                    }
                }
            }
        }
    }
    Ok(stories)
}

#[tauri::command]
fn load_story(app: AppHandle, title: String) -> Result<String, String> {
    let app_dir = path::PathResolver::app_data_dir(&app.path()).map_err(|e| e.to_string())?;
    let stories_dir = app_dir.join("stories");
    let safe_title = sanitize_filename::sanitize(&title);
    let file_path = stories_dir.join(format!("{}.json", safe_title));
    std::fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_story(app: AppHandle, title: String) -> Result<(), String> {
    let app_dir = path::PathResolver::app_data_dir(&app.path()).map_err(|e| e.to_string())?;
    let stories_dir = app_dir.join("stories");
    let safe_title = sanitize_filename::sanitize(&title);
    let file_path = stories_dir.join(format!("{}.json", safe_title));
    std::fs::remove_file(&file_path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            exit_app,
            save_story,
            list_stories,
            load_story,
            delete_story
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
