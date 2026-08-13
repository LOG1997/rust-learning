# axum集成utoipa

## 简介

utoipa库是一个用于生成API文档的库，它可以自动生成API文档，并支持多种格式，如JSON、YAML、Markdown等。

## 流程

1. 安装依赖

    引入`utoipa`和`utoipa-swagger-ui`依赖，并且启用features:

    ```toml
    utoipa = { version = "5.5.0", features = ["axum_extras", "uuid", "macros", "chrono"] }
    utoipa-swagger-ui = { version = "9.0.2", features = ["axum"] }
    ```

2. 数据模型集成`utoipa`：
    在接口中使用到的`request`和`response`数据模型都需要派生`utoipa`的宏。
    a. `ToSchema`: 给`utoipa`识别的，只有派生了这个宏的模型才会被`utoipa`识别。
    b. `#[schema(example = ...)]`: 给模型添加示例数据，`utoipa`会根据这个示例数据生成文档。当然，也可以给单个字段添加示例数据。

3. 为单个接口添加文档：
    在单个接口上添加`#[utoipa::path(...)]`宏，并指定接口的请求方式、路径、请求参数、响应参数、描述等信息。
    示例如下：

    ```rust
    #[utoipa::path(
    post,
    path = "/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "成功获取用户列表", body = UserResponse)
    ),
    tag = "user"
    )]
    ```

4. 定义全局api文档结构：
    创建一个空的结构体，并且添加`#[]derive(OpenApi)`宏。然后在`#[openapi(...)]`宏里面添加api文档信息，我添加了以下字段：
    a. `paths`:添加路由处理器函数（需要函数派生`#[utoipa::path(...)]`宏）。
    b. `nest`:为处理器对应的路由添加统一的前缀，与`paths`只需要留一个就可以了，里面的`api`引入的是统一定义好的`paths`。
    c. `components`:添加模型结构体（需要结构体派生`ToSchema`宏）。
    d. `tags`:添加标签，用于分类。
    e. `modefiers`:添加全局参数，如token，需要定义一个空的结构体并且为其实现`utoipa::Modify`。
    全部代码放在下面了：

    ```rust
    // src/docs.rs

    use crate::PREFIX_UNIT;
    use crate::dto::user_request::{
        EditPasswordReq, EditSingleUsersRequest, LoginRequest, QueryUsersRequest, RegisterRequest,
    };
    use crate::dto::user_response::{UserResponse, UserResponseList};
    use utoipa::openapi::Components;
    use utoipa::openapi::security::HttpBuilder;
    use utoipa::openapi::security::{HttpAuthScheme, SecurityScheme};
    use utoipa::{Modify, OpenApi};

    # [derive(OpenApi)]
    # [openapi(paths(
        // auth模块
        crate::controller::auth::login,
        crate::controller::auth::callback_by_github,
        crate::controller::auth::oauth_by_github,
        crate::controller::auth::register,
        // 管理模块
        crate::controller::mgmt::add_account_by_superadmin,
        crate::controller::mgmt::get_user_list,
        // 个人信息模块
        crate::controller::profile::edit_user_info,
        crate::controller::profile::get_user_info,
        crate::controller::profile::edit_user_password
    ))]
    struct UserUnitApi;

    struct SecurityAddon;

    impl Modify for SecurityAddon {
        fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
            if openapi.components.is_none() {
                openapi.components = Some(Components::new());
            }
            let components = openapi.components.get_or_insert_with(Components::new);
            components.add_security_scheme(
                "bearerAuth",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .build(),
                ),
            );
        }
    }

    # [derive(OpenApi)]
    # [openapi(
        nest(
            (path = PREFIX_UNIT.get().expect("Prefix not initialized"), api = UserUnitApi)
        ),
        paths(
            // auth模块
            crate::controller::auth::login,
            crate::controller::auth::callback_by_github,
            crate::controller::auth::oauth_by_github,
            crate::controller::auth::register,
            // 管理模块
            crate::controller::mgmt::add_account_by_superadmin,
            crate::controller::mgmt::get_user_list,
            // 个人信息模块
            crate::controller::profile::edit_user_info,
            crate::controller::profile::get_user_info,
            crate::controller::profile::edit_user_password
        ),
        components(
            // 在这里列出所有用到的 DTO
            schemas(LoginRequest, RegisterRequest, UserResponse, QueryUsersRequest,UserResponseList,EditSingleUsersRequest,EditPasswordReq),
        ),
        modifiers(&SecurityAddon),
        tags(
            (name = "用户管理", description = "用户相关的 API 接口")
        )
    )]
    pub struct ApiDoc;

    ```

5. 在`main.rs`中设置路由并且挂载swagger ui：

    ```rust
    let swagger_ui_url = format!("{}/docs", prefix_unit);
    let swagger_json_url = format!("{}/api-docs/openapi.json", prefix_unit);

    let app=Router::new()
        .merge(SwaggerUi::new(swagger_ui_url.clone()).url(swagger_json_url, ApiDoc::openapi()))
        .nest(&prefix_unit, main_router);

    ```
