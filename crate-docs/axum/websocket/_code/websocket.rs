use anyhow::Result;
use axum::{
    Router,
    extract::{
        ConnectInfo, Query, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    http::HeaderMap,
    response::Response,
    routing::any,
};
use axum_extra::TypedHeader;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use std::net::SocketAddr;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
struct QueryAuth {
    token: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    let app = Router::new().route("/ws", any(ws_handler));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:7621").await?;

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;
    Ok(())
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    user_agent: Option<TypedHeader<headers::UserAgent>>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Query(token): Query<QueryAuth>,
) -> Response {
    println!("params is:\n  {addr:?} \n {user_agent:?} \n {headers:?} \n {token:?}");
    ws.on_upgrade(handle_socket)
}
async fn handle_socket(socket: WebSocket) {
    let (mut sender, mut receiver) = socket.split();
    tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    println!("text is {}", text);
                    sender.send(Message::Text(text)).await.ok();
                }
                Message::Binary(data) => {
                    println!("binary is {:?}", data);
                    sender.send(Message::Binary(data)).await.ok();
                }
                _ => {
                    println!("unknown message type");
                }
            }
        }
    })
    .await
    .ok();
}
