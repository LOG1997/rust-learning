# Redis的使用

在axum中使用redis，就是创建一个redis的连接池并且作为State共享，在处理器当中通过提取器获取并使用。

## 创建方式

分为两种方式：

1. 使用`redis` crate的默认方式，通过`ConnectionManager`来管理连接，本质不是连接池，而是一个自带“自动重连功能的单连接管理器”。
2. 使用`deadpool_redis`来管理连接池，可以维护n个连接。

推荐使用`deadpool_redis`来做redis的连接池，多个请求可以使用不同的空闲tcp连接，大幅提升吞吐量。

现在把原生的`redis`的`ConnectionManager`连接方式代码和`deadpool_redis`连接方式代码都贴在下面：

**`ConnectionManager`连接方式代码：**

```rust
// 创建连接
use redis::aio::ConnectionManager;
use redis::{Client, ConnectionAddr, ConnectionInfo, RedisConnectionInfo, RedisResult};

pub async fn create_redis_client(redis_url: &str) -> RedisResult<ConnectionManager> {
    let client = Client::open(redis_url)?;
    // 使用 ConnectionManager 自动管理重连和连接池
    ConnectionManager::new(client).await
}

// 使用此连接
let redis_client = create_redis_client(&config.redis_url).await?;


// 在处理器中写入数据
use redis::AsyncCommands;

let mut redis_conn = state.redis_client.clone();
let _: () = redis_conn
    .set_ex(&key, &token, state.config.jwt_expiration_secs) // 参数分别是key, value, 过期时间
    .await?;

// 在处理器当中读取数据
let mut redis_conn = state.redis_client.clone();
let redis_key = format!("user_github:{}", params.state);
let cached_oauthstate_redis: Option<String> = redis_conn.get(&redis_key).await?;
```

**`deadpool_redis`连接方式代码：**

```rust
// 创建连接
use anyhow::Result;
use deadpool_redis::{Config as DeadpoolConfig, Pool, Runtime};

pub async fn create_redis_client(redis_url: &str) -> Result<Pool> {
    let redis_cfg = DeadpoolConfig::from_url(redis_url);
    let redis_pool = redis_cfg.create_pool(Some(Runtime::Tokio1))?;
    Ok(redis_pool)
}

// 使用此连接
let redis_client = create_redis_client(&config.redis_url).await?;

// 在处理器中写入数据，与原生的connection_manager方式不一样，这里需要使用get方法获取一个连接，也同样要引入redis::AsyncCommands，因为还使用的redis的连接
use redis::AsyncCommands;

let mut redis_conn = state.redis_client.get().await?;
let key = format!("user_pc:{}", user.id);
let _: () = redis_conn
    .set_ex(&key, &token, state.config.jwt_expiration_secs)
    .await?;
// 在处理器当中读取数据
let mut redis_conn = state.redis_client.get().await?;
let redis_key = format!("user_github:{}", params.state);
let cached_oauthstate_option: Option<String> = redis_conn.get(&redis_key).await?;

```
