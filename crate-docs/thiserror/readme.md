# thiserr错误处理库

thiserror处理库可以极大的方便开发者去管理自定义的错误类型。

## 它能做什么

在代码中写下 #[derive(Error)]宏后，会在编译期实现

- std::fmt::Display：通过 #[error("...")] 定义的文案，决定错误被 println! 或 to_string() 时显示什么。
- std::error::Error::source()：如果变体内部包含了其他错误类型（比如 sqlx::Error），它会自动将内部错误标记为底层“源”错误，支持 e.source() 链式追踪。
- 可选的 From 转换：通过 #[from] 注解，自动生成将底层错误提升为 AppError 的 From 实现。

## 使用方法

如果定义一个错误类型，可以给这个错误类型直接加上thiserror的宏。

```rust
// 静态文本（无参数）
#[error("用户不存在")]
UserNotFound,

// 带位置参数（格式化字符串，规则同 Rust 的 format!）
#[error("参数校验失败: {0}")]   // {0} 表示元组结构体的第一个字段
Validation(String),

// 带具名字段（如果你用结构体变体）
#[error("用户 {name} 权限不足")]
Forbidden { name: String },
```

1. #[from]——自动错误转换

```rust
Database(#[from] sqlx::Error),
```

它会生成的代码如下

```rust
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err)
    }
}
```

后面有使用到的高级特性再来这里记录
