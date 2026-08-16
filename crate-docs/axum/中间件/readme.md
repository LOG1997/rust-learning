# 中间件 `middleware`

axum的中间件按我的理解其实就是一种处理器，只不过这个处理器是放在请求开始处理之前/之后的，它能在请求到达你的业务逻辑之前或响应返回到客户端之后执行额外的处理。

核心思想是在“请求与响应”的处理中插入可复用的逻辑，例如日志记录、身份验证等。

`axum`并没有一套新的中间件系统，直接复用并集成了`tower`生态的抽象，可以直接复用`tower`和`tower-http`两个库中成熟的的中间件。

在写作的时候还没有在项目中应用太多`tower`和`tower-http`的中间件，所以暂时先只记录自定义中间件这个功能。


## 自定义中间件

自定义中间件与普通请求一样，也可以使用axum的提取器，取出`request`、`header`都可以。提取出来过后可以对`req`和`header`等做出修改（这不就是中间件的作用吗）。

做完操作以后，需要使用next方法将这个请求返回给下一步执行。

先给一个例子，实现功能是只有`admin/superadmin`权限的才能进行访问：

```rust
use axum::{extract::Request, middleware::Next, response::Response};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;

pub async fn admin_middleware(req: Request, next: Next) -> Result<Response, AppError> {
    let auth_user = req.extensions().get::<AuthUser>().cloned().ok_or_else(|| {
        AppError::Unauthorized("Unauthorized: missing authentication".to_string())
    })?;

    if auth_user.role.to_uppercase() != "ADMIN" && auth_user.role.to_uppercase() != "SUPERADMIN" {
        return Err(AppError::Forbidden("请使用管理员/超管登录访问".to_string()));
    }
    Ok(next.run(req).await)
}
```

定义好了中间件，应该怎么去使用呢？很简单，在定义路由的时候将这个中间件通过`layer`方法挂载就行了。

举个例子：

```rust

 Router::new()
        .route("/getUserList", post(controller::mgmt::get_user_list))
        .layer(middleware::from_fn(admin_middleware))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_user_middleware,
        ))
```

可以注意到`layer`挂载方法中使用到`middleware`下面的`from_fn_with_state`方法将中间件导入。

不需要传入`state`的可以使用`middleware::rom_fn`。

还有修改响应的中间件后面在总结，暂时没有使用到。

## `tower`和`tower-http`自带中间件
