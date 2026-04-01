#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use tauri::{AppHandle, Manager, State};
use tauri_plugin_shell::{process::CommandChild, ShellExt};

struct BridgeChild(Mutex<Option<CommandChild>>);

#[tauri::command]
fn bridge_status() -> &'static str {
  "launcher-ready"
}

fn launch_bridge(app: &AppHandle) -> Result<CommandChild, String> {
  let sidecar = app
    .shell()
    .sidecar("TycoonStreamBridge")
    .map_err(|err| format!("failed to prepare sidecar: {err}"))?
    .env("STREAM_BRIDGE_NO_BROWSER", "1")
    .env("STREAM_BRIDGE_OPEN_LAUNCHER", "0")
    .env("STREAM_BRIDGE_OPEN_BROWSER", "0");

  let (rx, child) = sidecar.spawn().map_err(|err| format!("failed to start sidecar: {err}"))?;

  tauri::async_runtime::spawn(async move {
    let mut events = rx;
    while let Some(event) = events.recv().await {
      println!("[tycoon-stream-bridge/mac sidecar] {:?}", event);
    }
  });

  Ok(child)
}

fn stop_bridge(state: State<'_, BridgeChild>) {
  if let Some(mut child) = state.0.lock().expect("bridge mutex poisoned").take() {
    let _ = child.kill();
  }
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .manage(BridgeChild(Mutex::new(None)))
    .invoke_handler(tauri::generate_handler![bridge_status])
    .setup(|app| {
      let child = launch_bridge(app.handle())?;
      let bridge_state = app.state::<BridgeChild>();
      *bridge_state.0.lock().expect("bridge mutex poisoned") = Some(child);
      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::Destroyed = event {
        let state = window.state::<BridgeChild>();
        stop_bridge(state);
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
