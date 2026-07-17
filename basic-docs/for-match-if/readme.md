# for/loop/while/if/match

## 循环

### for循环

for循环是Rust中最常用的循环结构，它可以遍历一个迭代器或集合中的元素。

基本语法

```rust
for item in collection {...}
```

在`for`循环中可以使用`break`和`continue`来控制循环的流程。`break`直接跳出循环；`continue`跳过当前循环，继续下一次循环。

1. 遍历范围

左闭右开：`for i in 0..10 { ... }`

左闭右闭：`for i in 0..=10 { ... }`

2. 遍历集合

不可变借用: `for item in &collection {...}`

可变借用: `for item in &mut collection {...}`

转移所有权：`for item in collection {...}`

3. 获取索引

使用enumerate

```rust
for (index, item) in collection.iter().enumerate() {
    println!("index: {}, item: {}", index, item);
}
```

### loop循环

loop循环默认为无限循环，配合break退出

基本语法：

```rust
loop {
    ...
}
```

循环标签：处理嵌套循环中断，给外层循环加上标签，即可以在内层循环中指定停止外层循环。

| 为什么不能在普通程序中对其进行中断呢？因为loop阻塞了主线程，无法在后续代码中对其进行中断

示例：

```rust
'outer: loop {
    for i in 0..10 {
        if i == 5 {
            break 'outer;
        }
    }
}
```

### while循环

while循环在条件满足时执行循环，不满足时退出。

基本语法：

```rust
while condition {
    ...
}
```

同样可以使用`break`跳出循环，`continue`继续循环

while let语法：

只要条件匹配就一直执行（可以跟if let对比）。

| 其实就是loop里面添加了match匹配

比如处理vec元素的弹出：

```rust
while let Some(top) = vec.pop(){
    println!("{:?}", top);
}
```

## 分支

### if分支

基本语法不必多言，很简单

```rust
if condition {
    ...
} else {
    ...
}
```

if let语法：是match的简化，专心处理一种成功模式，其余的都忽略

```rust
let optional = Some("Hello");

// 等效于 match optional { Some(s) => ..., _ => () }
if let Some(s) = optional {
    println!("包含字符串: {}", s);
} else {
    println!("是 None");
}
```

let else:“要么成功结构，要么立刻走人”

```rust
let 模式 = 表达式 else {
    // 这里必须是一个“发散”代码块（即必须导致函数返回/循环跳出/崩溃）
    // 比如：return, break, continue, panic!, 或调用 ! 返回类型的函数
};
// 如果上面的解构成功，程序会继续执行到这里，且变量在此作用域内直接可用
```

例子：

```rust
fn get_first_word(s: Option<String>) -> String {
    let Some(inner) = s else {
        // 这里必须返回！不能执行其他逻辑后继续
        return String::from("empty");
    };
    // 从这里开始，inner 已经解构，并且 s 的所有权已被部分移动（或完全移动）
    inner.chars().take(1).collect()
}
// 好处：与 match 相比，缩进层级少，可读性极高。
```

### match

模式穷尽检查，需要去处理所有情况。

示例：

```rust
 let score = 12;

    match score {
        0 => println!("零分"),
        1 | 2 | 3 => println!("低分"),
        4..=10 => println!("及格"),             // 匹配 4 到 10（包含）
        n @ 11..=20 => println!("高分: {}", n), // 绑定匹配的值到变量 n
        _ => println!("超出范围"),
    }
```

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 5 };

    match p {
        Point { x: 0, y } => println!("x 为 0，y = {}", y),
        Point { x, y: 0 } => println!("y 为 0，x = {}", x),
        Point { x, y } => println!("x = {}, y = {}", x, y),
    }
    // 输出: x 为 0，y = 5
}
```
