# Router

[getStarted](../getStarted/readme.md)中构建一个最小项目使用到了router，这里简单介绍下router。

router是axum中的一个核心概念，用于定义路由，并绑定处理函数。接口请求会根据访问路径取匹配路由执行不同的处理函数。

## route

会从router中匹配访问路径，并执行对应的处理函数。

router的创建方式如下：

```rust
Router::new()
    .route("/", get(root_handler))
    .route("/users", post(create_user_handler))
    .route("/users/:id", get(get_user_handler));
```

## nest

nest用于给router添加一个前缀路径，所有的路由都会加上这个前缀。

这段代码会给后续的route添加一个前缀"/api"。

```rust
Router::new()
    .nest("/api", Router::new()
    .route("/users", post(create_user_handler))
    ...
```

## merge

merge用于将多个router合并为一个router，适用于按模块拆分路由后将其合并为一个router。

```rust
Router::new()
    .merge(users_router)
    .merge(orders_router)
```

## with_state

with_state用于将一个状态对象绑定到router中，这个状态对象可以在处理函数中访问，最常见的就是多个处理函数共享数据库连接池。

```rust
Router::new()
    .route("/users", get(get_users))
    .with_state(AppState::new())
```

## fallback

fallback用于处理没有匹配的路由，比如请求了一个不存在的路由，或者请求了一个不存在的方法，返回统一的内容（比如未访问到内容则返回404的html）。

```rust
Router::new()
    .route("/api/health", get(health_handler))
    .fallback(handle_404);
```

## layer

layer用于给router添加中间件，常见的中间件有日志、限流、鉴权等。关于全局鉴权，在后续中间件和jwt章节有相关介绍。

```rust
Router::new()
    .route("/api/health", get(health_handler))
    .layer(TraceLayer::new_for_http());
```
