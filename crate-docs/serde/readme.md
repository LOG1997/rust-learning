# serde

serde是rust生态中**序列化**和**反序列化**的事实标准框架。

> 什么叫**序列化**与**反序列化**。
> 序列化：把内存中的rust结构体数据，变成可存储或可传输的格式（字节流、字符串等）。
> 反序列化：把可存储或可传输的数据格式解析并重建为rust的结构体数据。

## 使用方法

serde定义了方便使用的宏，所以在代码中使用serde很简单。

1. 安装依赖

```toml
serde = { version = "1.0.229", features = ["derive"] }
serde_json = "1.0.151"
```
2. 为目标数据结构体实现**Serialize**(序列化)和**Deserialize**（反序列化）宏，就可以为结构体自动生成序列化和反序列化的代码。

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct Person {
    name: String,
    age: u8,
}
```

3. 序列化与反序列化的具体操作：上一步只是定义了该结构体可以被序列化和反序列化，实际操作需要使用其他的方法，比如把结构体序列化成json格式的字符串数据或者反序列化：

```rust
fn main() -> Result<(), serde_json::Error> {
    let person = Person { name: "Alice".to_string(), age: 30 };

    // 序列化：Rust 结构体 -> JSON 字符串
    let json_string = serde_json::to_string(&person)?;
    println!("Serialized: {}", json_string); // 输出: {"name":"Alice","age":30}

    // 反序列化：JSON 字符串 -> Rust 结构体
    let deserialized_person: Person = serde_json::from_str(&json_string)?;
    println!("Deserialized: {:?}", deserialized_person); 
    Ok(())
}
```

## 高级特性

1. #[serde(rename = "full_name")]：重命名字段，在序列化的时候将指定字段映射为其他字段名。
```rust
#[derive(Serialize, Deserialize)]
struct User {
    #[serde(rename = "full_name")]
    name: String,
}
```

2. 跳过空值，当字段为None时，在序列化输出中省略该字段，序列化输出后不会展示该字段。

当然也可以直接设置不序列化该字段，比如结构体当中含有密码的时候，就不会在序列化输出的时候带上密码字段。

也可以直接使用skip，序列化和反序列化的时候都跳过该字段
```rust
#[derive(Serialize, Deserialize)]
struct User {
    #[serde(skip_serializing_if = "Option::is_none")]
    email: Option<String>,
    #[serde(skip_serializing)]
    paassword:String
    #[serde(skip)]
    paassword_hash:String
      
}
```

3. 展开并入，在序列化的时候，将rust结构体的内部字段打平平铺在当前层级。在反序列化的时候将平铺的层级组装起来。
