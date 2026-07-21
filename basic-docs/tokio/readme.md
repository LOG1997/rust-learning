# tokio

tokio是什么？它是rust生态中的异步运行时框架，拥有广泛的应用，尤其在网络服务这一领域。

## 特点

特别适用于IO密集型任务。

## 基本使用

1. 安装依赖

在`Cargo.toml`中添加依赖`tokio`：

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

> `full`功能开启所有特性，适合学习。实际使用中建议按需要启用特性，如`rt`（运行时），`macros`（宏），`net`（网络）等。

2. 代码入口

使用#[tokio::main]宏将`main`函数变为异步入口，并且启动`tokio`运行时。

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    println!("Tokio 启动！");
    sleep(Duration::from_secs(2)).await; // 异步等待2秒，不阻塞线程
    println!("2 秒后醒来！");
}
```

3. 创建并发任务`tokio::spawn`

使用`tokio::spawn`宏可以在异步上下文中创建并发任务：

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    // 创建任务1
    let handle1 = tokio::spawn(async {
        sleep(Duration::from_secs(1)).await;
        println!("任务1完成");
    });

    // 创建任务2
    let handle2 = tokio::spawn(async {
        sleep(Duration::from_secs(2)).await;
        println!("任务2完成");
    });

    // 等待所有任务完成
    handle1.await.unwrap();
    handle2.await.unwrap();
    println!("所有任务结束");
}
```

`tokio::spawn`返回的是一个`JoinHandle`，可以通过`.await`等待任务完成并且获取返回值。

如果需要等待多个任务完成可以使用`tokio::join!`宏。
