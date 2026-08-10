# Get Started

使用axum开发web服务，首先就要在服务其中启动一个服务。

首先来看需要哪些依赖，必装依赖：
`tokio`：tokio是一个异步运行时，用于处理I/O操作，是axum的基础依赖。
`axum`： axum是一个web框架，用于开发web服务。

为了便于开发，最简单的依赖还可以添加这些：
`anyhow`：anyhow是一个错误处理库，用于处理错误。

启动一个web服务最简单的代码如下：

```rust

use anyhow::Result;
use axum::{routing::get, Router};
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> Result<()> {
    // 此处的get_handler是一个处理函数，处理请求的逻辑
    let app = Router::new().route("/", get_handler);
    // 新建一个tcp监听器
    let listener = TcpListener::bind("127.0.0.1:3000").await?;
    // axum::serve启动一个http服务，接受一个listener和一个router
    axum::serve(listener, app).await?;
    Ok(())
}
```

> 这段代码不能运行，因为没有定义get_handler函数。
> 处理函数涉及到提取器的概念，请移步下一章[提取器](../提取器/readme.md)
