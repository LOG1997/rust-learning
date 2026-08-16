# 错误处理和统一返回

## 错误处理

在开发过程中会引入很多其他的库，也就会有很多错误类型（rust核心库也会有很多错误类型），但是作为一个应用，很明显错误信息只会有一个类型，如果函数中返回了其他错误类型，rust是不会通过编译的。

我们可以在通用模块中定义一个统一的错误类型，把应用中需要使用到的错误都囊括进去，然后在主应用中就可以只用处理这一个错误类型了，也可以将其他错误类型转换为这个统一的错误类型。


### 理清需求、

我们先来规划一下需要哪些东西：

1. 首先报错信息肯定涉及到http状态码，401、403、404、500、520等状态码表达不同的错误状态，明确哪些是客户端请求错误，哪些是服务端处理错误。

2. 作为一个成熟的应用，肯定需要有成熟的返回数据，所以需要有一个完整清晰的返回数据的结构，里面数据有code、data、msg、success。
其中data在报错时一般为空(null)；msg是具体的报错信息由子服务在处理错误时传入；code是自定义的业务错误编码，方便快速定位报错发生在哪；success为布尔值，报错时一般为false，代表该次请求失败。

### 分步实现

好，下面我们来分步实现统一的报错模块：

1. 首先定义业务错误编码code，比如我们规定10000代表该次请求成功，其他错误码代表发生相应的错误。

可以做出这样的业务错误编码定义：

```rust
pub mod code {
    // 成功状态码
    pub const SUCCESS: i32 = 10000;
    // 通用模块状态码
    pub const VALIDATION_ERROR: i32 = 10001;
    pub const CONFLICT: i32 = 10002;
    pub const UNAUTHORIZED: i32 = 10003;
    pub const FORBIDDEN: i32 = 10004;
    pub const NOTFOUND: i32 = 10005;
    // 用户模块状态码
    pub const USER_NOT_FOUND: i32 = 10101;
    pub const INVALID_CREDENTIALS: i32 = 10102;
    pub const TOKEN_EXPIRED: i32 = 10103;
    // gateway模块
    pub const NOT_FOUND_ROUTE: i32 = 10201;
    // 系统错误
    pub const INTERNAL_ERROR: i32 = 50000;
}
```

为什么要使用mod？是为了将所有错误码做一个聚合，在其他子服务引用时可以获得清晰的导入结构。

在这里分模块定义了各个状态码，后续肯定会随着业务复杂度提升逐渐扩充错误码数量的，可以发现每个模块的错误码定义都留了相当大余量。

2. AppErr错误枚举定义，这是外部应用使用这个统一的报错类型的主要引用对象。

```rust
pub enum AppError {
    // 通用错误
    #[error("参数校验失败: {0}")]
    Validation(String),
    #[error("资源冲突: {0}")]
    Conflict(String),
    #[error("数据库错误: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError), // 利用 thiserror 自动生成 From
    #[error("Redis Pool error: {0}")]
    RedisPool(#[from] PoolError), // 利用 thiserror 自动生成 From
    #[error("未授权: {0}")]
    Unauthorized(String),
    #[error("权限不足禁止访问：{0}")]
    Forbidden(String),
    #[error("未找到资源")]
    NotFound,
    // 用户模块错误
    #[error("用户不存在")]
    UserNotFound,
    #[error("密码错误")]
    InvalidCredentials,
    #[error("令牌过期")]
    TokenExpired,
    #[error("token生成错误")]
    JWTError(#[from] jsonwebtoken::errors::Error),
    // Gateway模块
    #[error("未找到路由:{0}")]
    NotFounRoute(String),
    // 系统错误
    #[error("内部错误: {0}")]
    Internal(String),
    // 可继续扩展其他错误类型
}
```

这里使用到了`thiserror`库来便捷的处理错误定义，通过 `#[derive(Error)]` 和 `#[error("...")]` 宏，自动为每个变体实现 `std::fmt::Display`，这样 `to_string()` 就能返回友好的错误描述。

`#[from]` 的作用：让 `thiserror` 自动生成 `From<sqlx::Error> for AppError`、`From<redis::RedisError> for AppError` 等实现，这样就可以在函数中用 ? 运算符直接将底层错误转换为 `AppError`，极大简化代码。

还会为AppError实现From特性，这样就会把其他的错误转化为这里已定义的错误类型。这区别于thiserror的宏，因为thiserror的#[from]宏是把引入的错误类型转化为AppError中的新增的类型。

```rust
impl From<url::ParseError> for AppError {
    fn from(err: url::ParseError) -> Self {
        AppError::Internal(err.to_string())
    }
}
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}
```

3. AppError方法实现，前面定义了业务错误码code，为一些不同的错误类型添加了message，但是code和AoppError中的错误还没有关联，塑腰为AppError实现方法去做一些关联。

code方法是把错误类型映射为对应的错误码，message方法是把应用中返回的错误带有的msg提取出来，这两个数据需要在组装axum::Response是传入。

```rust
impl AppError {
    /// 获取对应的错误码
    pub fn code(&self) -> i32 {
        match self {
            AppError::UserNotFound => code::USER_NOT_FOUND,
            AppError::InvalidCredentials => code::INVALID_CREDENTIALS,
            AppError::Validation(_) => code::VALIDATION_ERROR,
            AppError::Conflict(_) => code::CONFLICT,
            AppError::Unauthorized(_) => code::UNAUTHORIZED,
            AppError::TokenExpired => code::TOKEN_EXPIRED,
            AppError::Database(_) | AppError::Internal(_) => code::INTERNAL_ERROR,
            AppError::Forbidden(_) => code::FORBIDDEN,
            AppError::Redis(_) => code::INTERNAL_ERROR,
            AppError::RedisPool(_) => code::INTERNAL_ERROR,
            AppError::JWTError(_) => code::INTERNAL_ERROR,
            AppError::NotFound => code::NOTFOUND,
            AppError::NotFounRoute(_) => code::NOT_FOUND_ROUTE,
        }
    }

    /// 获取错误消息（用于显示）
    pub fn message(&self) -> String {
        match self {
            AppError::Validation(msg) => msg.clone(),
            AppError::Conflict(msg) => msg.clone(),
            AppError::Unauthorized(msg) => msg.clone(),
            AppError::Internal(msg) => msg.clone(),
            _ => self.to_string(), // 使用 thiserror 生成的 Display 输出
        }
    }
}
```

4. 实现IntoResponse(将错误转为http响应)，因为我们的错误信息也要以http响应向客户端传播，所以需要实现这个trait

在这里需要把code、message、success、data组装起来，会使用到从其他文件中引入的自定义的ApiResponse类型；然后整体使用into_response方法将其转为IntoResponse。

还会根据不同的业务错误码，设置不同的http响应码。


```rust
// 实现 IntoResponse，将 AppError 转换为标准 JSON 响应
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let code = self.code();
        let msg = self.message();
        let body = Json(crate::response::ApiResponse::<()>::error(code, msg));
        // 根据错误类型设置 HTTP 状态码（可灵活调整）
        let status = match self {
            AppError::UserNotFound => StatusCode::NOT_FOUND,
            AppError::InvalidCredentials => StatusCode::UNAUTHORIZED,
            AppError::Validation(_) => StatusCode::BAD_REQUEST,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            AppError::TokenExpired => StatusCode::UNAUTHORIZED,
            AppError::Database(_) | AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Redis(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Forbidden(_) => StatusCode::FORBIDDEN,
            AppError::RedisPool(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::JWTError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::NotFound => StatusCode::NOT_FOUND,
            AppError::NotFounRoute(_) => StatusCode::NOT_FOUND,
        };
        (status, body).into_response()
    }
}
```

5. 最后设置一个别名AppResult，在应用中代替Result进行使用。

```rust

// 方便 Result 类型别名
pub type AppResult<T> = Result<T, AppError>;

```

## 统一的返回数据类型

上面提到引入的ApiResponse就是统一的返回数据类型，给一个这样的结构：

```rust
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub code: i32,
    pub success: bool,
    pub msg: Option<String>,
    pub data: Option<T>,
}
```

然后为其实现两个方法success和error，这两个方法对应请求成功和请求失败，在handler中返回数据时，调用ApiResponse::success进行数据组装，而ApiResponse::error是在错误统一处理时调用（见上文错误的统一处理）。

```rust
impl<T> ApiResponse<T> {
    /// 成功响应，code=10000, success=true, msg=Some(message), data=Some(data)
    pub fn success(data: T, msg: Option<String>) -> Self {
        Self {
            code: 10000,
            success: true,
            msg,
            data: Some(data),
        }
    }

    /// 错误响应，code=错误码, success=false, msg=Some(message), data=None
    pub fn error(code: i32, msg: String) -> ApiResponse<()> {
        ApiResponse {
            code,
            success: false,
            msg: Some(msg),
            data: None,
        }
    }
}
```

可以不去实现IntoResponse，因为这个ApiResponse是会包在上文定义的AppResult里面的。
也可以去实现一下。
