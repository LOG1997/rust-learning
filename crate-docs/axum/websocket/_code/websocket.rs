use anyhow::{Ok, Result};
use axum::{
    Router,
    extract::{WebSocketUpgrade, ws::WebSocket},
    response::Response,
    routing::any,
};
use axum_extra::TypedHeader;

#[tokio::main]
async fn main() -> Result<()> {
    let app = Router::new().route("/ws", any(ws_handler));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:7621").await?;

    axum::serve(listener, app).await?;
    Ok(())
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    user_agent: Option<TypedHeader<headers::UserAgent>>,
) -> Response {
    println!("user agent: {:?}", user_agent);
    ws.on_upgrade(handle_socket)
}
async fn handle_socket(mut socket: WebSocket) {
    while let Some(msg) = socket.recv().await {
        println!("msg is {:?}", msg);
    }
}
