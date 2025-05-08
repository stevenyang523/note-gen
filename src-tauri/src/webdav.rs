use reqwest_dav::{Auth, Client, ClientBuilder, Depth};

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
