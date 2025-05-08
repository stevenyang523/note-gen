use reqwest_dav::{Auth, Client, ClientBuilder, Depth};
use std::path::Path;
use tauri::{AppHandle, Manager};
use std::fs;

fn create_client(url: &str, username: &str, password: &str) -> Result<Client, String> {
    let host_url = if url.ends_with('/') {
        url.to_string()
    } else {
        format!("{}/", url)
    };

    ClientBuilder::new()
        .set_host(host_url)
        .set_auth(Auth::Basic(username.to_owned(), password.to_owned()))
        .build()
        .map_err(|e| format!("Failed to create WebDAV client: {}", e))
}

#[tauri::command]
pub async fn webdav_test(url: String, username: String, password: String, path: String) -> Result<bool, String> {
    let client = match create_client(&url, &username, &password) {
        Ok(client) => client,
        Err(e) => return Err(e),
    };
    
    let test_path = if path.starts_with('/') {
        path[1..].to_string()
    } else {
        path
    };
    
    match client.list(&test_path, Depth::Infinity).await {
        Ok(_) => Ok(true),
        Err(e) => {
            // 如果不存在目录则创建
            if let Err(create_err) = client.mkcol(&test_path).await {
                return Err(format!("Connection failed: {}, couldn't create directory: {}", e, create_err));
            }
            
            match client.list(&test_path, Depth::Infinity).await {
                Ok(_) => Ok(true),
                Err(e) => Err(format!("Connection failed: {}", e)),
            }
        },
    }
}

async fn get_markdown_files(dir_path: &str, is_custom_workspace: bool, app_handle: &AppHandle) -> Result<Vec<(String, String)>, String> {
    Box::pin(_get_markdown_files(dir_path, is_custom_workspace, app_handle)).await
}
async fn _get_markdown_files(dir_path: &str, is_custom_workspace: bool, app_handle: &AppHandle) -> Result<Vec<(String, String)>, String> {
    let mut markdown_files = Vec::new();

    println!("dir_path: {}", dir_path);
    println!("is_custom_workspace: {}", is_custom_workspace);
    
    let entries = if is_custom_workspace {
        fs::read_dir(dir_path)
            .map_err(|e| format!("Failed to read directory {}: {}", dir_path, e))?            
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect directory entries: {}", e))?
    } else {
        let app_data_dir = app_handle.path().app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?;
        let full_path = app_data_dir.join(dir_path);
        fs::read_dir(full_path)
            .map_err(|e| format!("Failed to read directory {}: {}", dir_path, e))?            
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect directory entries: {}", e))?
    };

    println!("Entries: {:#?}", entries);
    
    for entry in entries {
        let path = entry.path();
        let file_name = path.file_name().unwrap().to_string_lossy().to_string();
        
        if path.is_dir() && !file_name.starts_with(".") {
            let sub_dir_path = path.to_string_lossy().to_string();
            let sub_files = Box::pin(_get_markdown_files(&sub_dir_path, is_custom_workspace, app_handle)).await?;
            markdown_files.extend(sub_files);
        } else if path.is_file() && file_name.ends_with(".md") && !file_name.starts_with(".") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;
            
            let relative_path = if is_custom_workspace {
                let workspace_path = dir_path.trim_end_matches('/');
                path.to_string_lossy()
                    .trim_start_matches(workspace_path)
                    .trim_start_matches('/')
                    .to_string()
            } else {
                let app_data_dir = app_handle.path().app_data_dir()
                    .map_err(|e| format!("Failed to get app data dir: {}", e))?;
                let article_dir = app_data_dir.join("article");
                path.strip_prefix(&article_dir)
                    .map_err(|e| format!("Failed to get relative path: {}", e))?.
                    to_string_lossy()
                    .to_string()
            };
            
            markdown_files.push((relative_path, content));
        }
    }
    
    Ok(markdown_files)
}

#[tauri::command]
pub async fn webdav_backup(url: String, username: String, password: String, path: String, app: AppHandle) -> Result<String, String> {
    let client = match create_client(&url, &username, &password) {
        Ok(client) => client,
        Err(e) => return Err(e),
    };
    
    let webdav_path = if path.starts_with('/') {
        path[1..].to_string()
    } else {
        path.clone()
    };

    if let Err(_) = client.list(&webdav_path, Depth::Infinity).await {
        if let Err(e) = client.mkcol(&webdav_path).await {
            return Err(format!("Failed to create directory on WebDAV server: {}", e));
        }
    }
    
    let store_path = app.path().app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?
        .join("store.json");
    
    let store_contents = fs::read_to_string(&store_path)
        .map_err(|e| format!("Failed to read store file: {}", e))?;

    let store_json: serde_json::Value = serde_json::from_str(&store_contents)
        .map_err(|e| format!("Failed to parse store JSON: {}", e))?;

    let store_workspace_path = store_json.get("workspacePath").and_then(|v| v.as_str()).unwrap_or("article");

    let workspace_path = if store_workspace_path.is_empty() {
        ("article".to_string(), false)
    } else {
        (store_workspace_path.to_string(), true)
    };

    let markdown_files = get_markdown_files(&workspace_path.0, workspace_path.1, &app).await?;
    
    let mut success_count = 0;
    let total_files = markdown_files.len();
    
    for (relative_path, content) in markdown_files {
        let remote_path = format!("{}/{}", webdav_path.trim_end_matches('/'), relative_path);
        
        if let Some(parent) = Path::new(&remote_path).parent() {
            let parent_str = parent.to_string_lossy().to_string();
            if !parent_str.is_empty() && parent_str != "." {
                if let Err(_) = client.list(&parent_str, Depth::Infinity).await {
                    if let Err(e) = client.mkcol(&parent_str).await {
                        return Err(format!("Failed to create directory {} on WebDAV server: {}", parent_str, e));
                    }
                }
            }
        }
        
        let content_bytes = content.as_bytes().to_vec();
        if let Err(e) = client.put(&remote_path, content_bytes).await {
            return Err(format!("Failed to upload file {} to WebDAV server: {}", relative_path, e));
        }
        
        success_count += 1;
    }
    
    Ok(format!("{}/{}", success_count, total_files))
}
