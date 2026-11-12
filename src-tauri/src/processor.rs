use std::fs;
use std::path::Path;

use folder2txt_core::{run_process, ProcessOptions, ProcessResult};

#[tauri::command]
pub async fn process_folder(options: ProcessOptions) -> Result<ProcessResult, String> {
    tauri::async_runtime::spawn_blocking(move || run_process(options))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn pick_folder() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        rfd::FileDialog::new()
            .set_title("انتخاب پوشه پروژه")
            .pick_folder()
            .map(|path| path.to_string_lossy().to_string())
    })
    .await
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn save_output(
    default_name: String,
    content: String,
) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut dialog = rfd::FileDialog::new()
            .set_title("ذخیره فایل خروجی")
            .set_file_name(&default_name);

        if let Some(extension) = Path::new(&default_name)
            .extension()
            .and_then(|value| value.to_str())
        {
            dialog = dialog.add_filter(extension, &[extension]);
        }

        match dialog.save_file() {
            Some(path) => {
                fs::write(&path, content)
                    .map_err(|error| format!("ذخیره فایل ناموفق بود: {error}"))?;
                Ok(Some(path.to_string_lossy().to_string()))
            }
            None => Ok(None),
        }
    })
    .await
    .map_err(|error| error.to_string())?
}
