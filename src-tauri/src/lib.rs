
use tauri::{Manager, State, Emitter};
use serialport::SerialPort;
use std::{
    io::{Write},
    sync::{Arc, Mutex},
    time::Duration,
};

#[derive(Default)]
struct SerialState {
    port: Option<Arc<Mutex<Box<dyn SerialPort>>>>,
}



#[tauri::command]
fn connect_serial(state: State<Arc<Mutex<SerialState>>>, port_name: String) -> Result<(), String> {
    let port = serialport::new(port_name, 9600)
        .timeout(Duration::from_millis(10))
        .open()
        .map_err(|e| e.to_string())?;

    let port = Arc::new(Mutex::new(port));
    state.lock().unwrap().port = Some(port.clone());
    Ok(())
}

#[tauri::command]
fn disconnect_serial(state: State<Arc<Mutex<SerialState>>>) -> Result<(), String> {
    let mut state = state.lock().unwrap();
    if let Some(port) = &state.port {
        let _ = port;
        state.port = None;
        Ok(())
    } else {
        Err("Puerto no conectado".into())
    }
}

#[tauri::command]
fn send_command(state: State<Arc<Mutex<SerialState>>>, command: String) -> Result<(), String> {
    let state = state.lock().unwrap();
    if let Some(port) = &state.port {
        let mut port = port.lock().unwrap();
        port.write_all(format!("{}\n", command).as_bytes())
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Puerto no conectado".into())
    }
}




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .manage(Arc::new(Mutex::new(SerialState::default())))
        .setup(|app| {
            let app_handle = app.handle().clone();
            let state = app.state::<Arc<Mutex<SerialState>>>();
            start_serial_monitoring(app_handle, state.inner().clone());
            Ok(())
        })
    .invoke_handler(tauri::generate_handler![connect_serial, disconnect_serial, send_command])
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri");
}

fn start_serial_monitoring(handle: tauri::AppHandle, state: Arc<Mutex<SerialState>>) {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(10));
        let re_res = regex::Regex::new(r"^RES=\d,\d+").unwrap();
        let mut line_buf = Vec::new();
        loop {
            interval.tick().await;
            // Get current port Arc without holding the state lock during IO
            let port_arc_opt = { state.lock().unwrap().port.clone() };
            if let Some(port_arc) = port_arc_opt {
                if let Ok(mut port) = port_arc.lock() {
                    // Read a small chunk to avoid blocking other operations like send_command
                    let mut buf = [0u8; 64];
                    match port.read(&mut buf) {
                        Ok(n) if n > 0 => {
                            for &b in &buf[..n] {
                                if b == b'\n' {
                                    if let Ok(line_str) = String::from_utf8(line_buf.clone()) {
                                        let line = line_str.trim_end_matches(['\r', '\n']);
                                        println!("Serial line: {}", line);
                                        if re_res.is_match(line) {
                                            let _ = handle.emit("serial-data", line.to_string());
                                            // println!("Serial data emitted: {}", line);
                                        }
                                    }
                                    line_buf.clear();
                                } else {
                                    line_buf.push(b);
                                }
                            }
                        }
                        Ok(_) => {}
                        Err(e) => {
                            // Ignore timeouts/non-fatal errors to keep loop responsive
                            // println!("Serial read error: {}", e);
                            let _ = e; // suppress unused warnings if println disabled
                        }
                    }
                }
            }
        }
    });
}

