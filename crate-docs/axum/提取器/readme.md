# 提取器(Extractor)

开发web后端应用肯定涉及到从请求体、header、query等参数中提取数据，axum提供了提取器(extractor)的概念来处理这些数据。

只需要在请求的处理函数（Handler）中指明需要哪些参数，axum会自动从请求中提取这些参数，并传递给处理函数。

！！！请注意，会消费数据的提取器，应该放到最后，因为数据消费了，后面的提取器就不能使用了，比如Json提取器就需要放到最后。

例如：

```rust
async fn my_handler(
    // 这些都是提取器，Axum 会自动填充它们
    Path(id): Path<u32>,
    Query(params): Query<HashMap<String, String>>,
    Json(payload): Json<CreateUser>,
) -> String {
    // 直接使用提取好的数据
    format!("id: {}, params: {:?}, payload: {:?}", id, params, payload)
}
```

处理函数（handler）的位k可以见上一章[getStarted](../getStarted/readme.md)。

## 常用内置提取器

| 名称 | 描述 | 示例 | 提取位置 |
| --- | --- | --- | --- |
| `Path<T>` | 从 URL 路径中提取参数 | `Path(id): Path<u32>` | `/users/**42**` |
| `Query<T>` | 从 URL 查询参数中提取参数。 | `Query(params): Query<HashMap<String, String>>` | `?key1=value1&key2=value2` |
| `Json<T>` | 从请求体中提取 JSON 数据。 | `Json(params): Json<CustomStructParams>` | `{"key1": "value1", "key2": "value2"}` |
| `Form<T>` | 从请求体中提取表单数据。 | `Form(params): Form<CustomStructParams>` | `{"key1": "value1", "key2": "value2"}` |
| `HeaderMap` | 从请求头中获取数据。 | `HeaderMap(headers)` | `headers` |
| `TypedHeader<T>` | 从请求头中获取指定类型的数据，这是类型安全的 | `TypedHeader(user_agent): TypedHeader<UserAgent>` | `User-Agent: Mozilla/5.0` |
| `RequestBody<Body>` | 获取到完整的请求体、包括方法、uri等。 | `RequestBody(body)` | {"method": "POST"} |
| `State<T>` | 共享状态，比如共享的数据库连接池。 | `State(state):State<AppState>` | -- |
| `Extension<T>` | 扩展状态，比如中间件中设置的状态。 | `Extension(auth_user):Extension<AuthUser>` | -- |

> Extension提取器不能跨项目提取，只能提取在本项目中注入的extension数据。

> 如果不确定是否传入，可以指定为Option<T>类型，其中T为HeaderMap等这些类型。
