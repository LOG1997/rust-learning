# 项目文件结构

```markdown
.
├─ src
│  ├─ main.rs # 项目入口文件
│  ├─ format.rs # 格式化函数的文件
│  ├─ operate.rs # 操作函数的文件
│  └─ lib.rs # 模块文件，统一管理模块
└─ tests # 测试文件
    ├─ test_format.rs.rs
    └─ test_operate.rs
```

为什么要使用lib.rs来统一管理模块？
为了在测试文件中对各模块进行正常的引入

## lib.rs内容

```rust
pub mod format;
pub mod operate;
```

在lib.rs中这样写过后，就相当于把format模块和operate模块都引入了opengit（本项目）。

## main.rs内容

在main.rs中这样引入：

```rust
use opengit::{
    format::{format_git_url, get_git_remote_url},
    operate::open_in_browser,
};
```

## 测试文件

在测试文件中这样引入

```rust
use opengit::format::{AddressType, format_git_url, get_domain_type, get_git_remote_url};
```

## 备注

模块文件中涉及到外部使用的函数、结构体、枚举等都需要使用pub关键字将其声明为公共的。
