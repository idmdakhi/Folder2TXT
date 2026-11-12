mod processor;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            processor::process_folder,
            processor::pick_folder,
            processor::save_output
        ])
        .run(tauri::generate_context!())
        .expect("error while running Folder2Txt desktop application");
}
