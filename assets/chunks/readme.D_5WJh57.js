const n=`# HashMap

## 核心概念

HashMap<K, V> 是 Rust 标准库 std::collections 下的哈希表实现，用于存储键值对（Key-Value）。

1. 键（Key）：用于唯一标识一个值，可以是任何实现了 Eq 和 Hash 特质（如 i32、String 等）的任意类型。
2. 值（Value）：存储的任意类型。

## 创建方法

1. 前置准备：引入 \`std::collections::HashMap\` 模块
2. 创建 HashMap：
   a.创建空的 HashMap：使用HashMap::new()方法创建一个空的 HashMap。

    \`\`\`rust
    // 1. 创建空 HashMap（指定类型，推荐新手）
    let mut map1: HashMap<&str, i32> = HashMap::new();
    map1.insert("apple", 5);
    map1.insert("banana", 3);

    // 2. 创建空 HashMap（类型推导，更简洁）
    let mut map2 = HashMap::new();
    map2.insert(1, "one"); // 编译器自动推导类型为 HashMap<i32, &str>
    map2.insert(2, "two");
    \`\`\`

   b.创建带初始化数据的 HashMap：HashMap::from()方法（键值对数组显示转换）、Into::into()方法（元组隐式转换）

    \`\`\`rust
    // 从键值对数组创建 HashMap
    let map = HashMap::from([
        ("a", 1),
        ("b", 2),
        ("c", 3),
    ]);

     // 元组列表通过 into() 转换为 HashMap
    let map: HashMap<&str, bool> = [("rust", true), ("java", false)].into();
    \`\`\`

   c. collect迭代器收集
    适合从现有迭代器生成 HashMap 的场景（比如过滤、映射后的数据），需指定类型（或通过上下文推导）

    \`\`\`rust
    // 示例1：从键值对迭代器收集
    let keys = ["x", "y", "z"];
    let values = [10, 20, 30];
    // zip 合并为 (键, 值) 迭代器，再 collect 为 HashMap
    let map: HashMap<_, _> = keys.iter().zip(values.iter()).collect();

    // 示例2：过滤后收集
    let numbers = [1, 2, 3, 4, 5];
    // 只保留偶数，键为数字，值为是否是偶数（恒为 true）
    let even_map: HashMap<_, _> = numbers
        .into_iter()
        .filter(|&n| n % 2 == 0)
        .map(|n| (n, true))
        .collect();
    \`\`\`

    d. 带默认值的HashMap:使用HashMap::with_capacity()创建制定容量的HashMap，后续向其中插入值。

    \`\`\`rust
    // 预分配容量为 10 的空 HashMap（避免频繁扩容）
    let mut map = HashMap::with_capacity(10);
    // 批量添加数据（容量足够，无需扩容）
    for i in 0..10 {
        map.insert(i, i * 2);
    }
    \`\`\`

    e. 从另一个HashMap科隆或者移动：

    \`\`\`rust
    // 原 HashMap
    let mut original = HashMap::new();
    original.insert("name", "Alice");
    original.insert("age", "20");

    // 方式1：克隆（原 HashMap 仍可用）
    let cloned = original.clone();
    println!("cloned: {:?}", cloned); // 输出和 original 一致
    original.insert("city", "Beijing"); // 原 map 可修改

    // 方式2：移动（原 HashMap 不可再用）
    let moved = original;
    println!("moved: {:?}", moved);
    // original.insert("gender", "female"); // 编译报错：original 已被移动
    \`\`\`

## 核心操作

1. **增**：使用 \`insert()\` 方法向 HashMap 中添加键值对。

    \`\`\`rust
    // 1. 插入键值对
    scores.insert("Math", 90);
    scores.insert("English", 85);
    // 插入已存在的键会覆盖旧值，返回旧值（Option类型）
    let old_value = scores.insert("Math", 95);
    \`\`\`

2. **删**：使用 \`remove()\` 方法从 HashMap 中删除指定的键。

    \`\`\`rust
    scores.remove("English");
    \`\`\`

3. **改**：
    - 使用 \`entry()\` 方法获取键对应的值，并修改它（结合 and_modify() + or_insert()，实现「存在则改，不存在则插」）。

    \`\`\`rust
    let mut map = HashMap::new();
    map.insert("apple", 5);
    
    // apple 存在：修改为 10；orange 不存在：插入 8
    map.entry("apple")
        .and_modify(|v| *v = 10)
        .or_insert(0); // 已存在，此值无效
    
    map.entry("orange")
        .and_modify(|v| *v += 1) // 不存在，不执行
        .or_insert(8); // 插入 8
    \`\`\`

    - 使用 \`insert()\` 方法将新的值插入到 HashMap 中，已存在的键对应的值插入时会覆盖。
    - 使用\`get_mut()\`方法修改值

    \`\`\`rust
    let mut map = HashMap::new();
    map.insert("apple", 5);
    map.insert("banana", 3);
    
    // 方式1：if let 处理（推荐）
    if let Some(value) = map.get_mut("apple") {
        *value += 5; // 解引用可变引用，修改值（5 → 10）
    }
    
    // 方式2：match 处理（更灵活，可处理 None）
    match map.get_mut("banana") {
        Some(v) => *v *= 2, // 3 → 6
        None => println!("banana 不存在"),
    }
    
    // 处理不存在的键（无操作，不崩溃）
    if let Some(v) = map.get_mut("orange") {
        *v = 8;
    } else {
        println!("orange 不存在，跳过修改");
    }
    \`\`\`

# HashSet

是Hash集合，本质是\`Hash<T,()>\`的封装(值是空元组，仅存储键)，存储唯一的元素，不允许重复，常用于判断元素是否存在、去重等场景。

> 跟js里面的Set类型比较类似。
`;export{n as default};
