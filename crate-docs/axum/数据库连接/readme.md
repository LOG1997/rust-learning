# 数据库连接

以postgres为例。

## 流程

### 安装依赖

serde和serde_json用于序列化和反序列化数据，sqlx用于数据库连接，uuid用于生成唯一标识符，validator用于数据验证。

其中
serde需要实现derive特性;
uuid需要实现serde和v4特性;
validator需要实现derive特性;
sqlx需要实现runtime-tokio、postgres、uuid、chrono特性,要实现uuid和chrono特性是因为写入或者读取数据过程中，需要使用到uuid和chrono类型;

```toml
dotenvy = "0.15.7"
serde = {version="1.0.229",features=["derive"]}
serde_json = "1.0.151"
sqlx = { version = "0.9.0", features = ["runtime-tokio", "postgres", "uuid", "chrono"] }
uuid = { version = "1.24.0", features = ["serde", "v4"] }
validator = { version = "0.21.0", features = ["derive"] }
```

### 数据库迁移（Migrations）

sqlx会自动读取.env中的DATABASE_URL环境变量来创建/连接数据库。

1. 直接安装`sqlx-cli`，用于数据库迁移操作。

    ```bash
    # supports all databases supported by SQLx
    cargo install sqlx-cli
    ```

2. 创建并运行数据库迁移。

    ```bash
    # 根据.env中的database_url创建数据库
    sqlx database create

    # 创建迁移文件
    sqlx migrate add create_users_table

    # 编辑sql文件

    # 运行迁移文件
    sqlx migrate run
    ```

3. 如果数据库结构有变化，则需要重新创建迁移文件并运行迁移文件。但是编译时校验还是会报错，因为sqlx读取的本地缓存并不知道数据库结构已经变化了。目前我的解决办法是执行`cargo clean`清除本地构建的产物后再次`cargo build`，这样构建时校验就会通过。

### 创建连接池

新建一个创建连接池的函数，返回类型为PgPool。

```rust
use anyhow::Result;
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;

pub async fn create_pool(
    database_url: &str,
    max_connections: Option<u32>,
    aquire_timeout_secs: Option<u64>,
) -> Result<PgPool, sqlx::Error> {
    // 连接池的最大连接数
    let max_connections = max_connections.unwrap_or(5);
    // 连接池的连接超时时间
    let acquire_timeout = Duration::from_secs(aquire_timeout_secs.unwrap_or(5));

    PgPoolOptions::new()
        .max_connections(max_connections)
        .acquire_timeout(acquire_timeout)
        .connect(database_url)
        .await
}
```

在main.rs中执行这个函数，并且将连接池赋值给AppState给路由访问。

### 在路由处理器中连接池

处理器中可以通过State提取器获取连接池的引用

```rust
async fn get_tasks(State(state): State<AppState>) -> Result<()>{}
```

### 访问数据库

在处理器中获取到连接池后，执行sql语句访问数据库（插入/查询/更新/删除）。

示例：

```rust
// 查询
pub async fn find_by_name(pool: &PgPool, name: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as!(User, "SELECT * FROM users WHERE name = $1", name)
        .fetch_optional(pool)
        .await
}
// 插入
pub async fn add_user(pool: &PgPool, user: User) -> Result<User, sqlx::Error> {
    sqlx::query!(
        "INSERT INTO users (id, email, name, nickname, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        user.id,
        user.email,
        user.name,
        user.nickname,
        user.password_hash,
        user.role.as_ref(),
        user.created_at,
        user.updated_at,
    )
    .execute(pool)
    .await
    .map_err(|e| sqlx::Error::from(e))
    .map(|_| user)
}
```

query!和query_as!是sqlx提供的宏，用于生成SQL语句。

||query!|query_as!|
|---|---|---|
|介绍|匿名记录，编译器生成一个未命名的结构体，字段与查g语句中的字段对应|显式指定结构体，需要预先定义struct并且实现`sqlx::FromRow`|
|代码|`query!("INSERT INTO users (id) VALUES ($1)",user.id)`|`query_as!(User, "SELECT * FROM users WHERE name = $1", name)`|
|场景|快速验证|讲解过映射为业务模型，便于后续处理|

使用连接池执行sql语句并且返回结果时，以下几个核心方法：

||execute|fetch_option|fetch_all|fetch_one|fetch|
|---|----|----|----|----|----|
|介绍|执行sql语句，返回执行结果|返回一个Option，如果结果为空则返回None，否则返回Some(T)|返回所有结果，将行一次性加载到内存中|只返回一行数据|获取每一行的结果，流式输出|
|特点|没有返回|零或者一(多行会报错)|只有一（多行会报错）|至少一个|多个|
|场景|insert、update、delete|select|select|select|select|
