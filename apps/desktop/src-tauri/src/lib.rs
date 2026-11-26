/// The heavy client: the same interface as the PWA (apps/web), in a window
/// of the operating system. Native work (local SQLite with SQLCipher, the
/// receipt printer, the barcode scanner) comes here as Tauri commands.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Syli Pharmacie");
}
