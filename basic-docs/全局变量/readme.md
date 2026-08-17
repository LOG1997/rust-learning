# Rust中的全局变量

在rust中定义全局变量有两种场景：编译期初始化、运行时初始化（三方库和标准库）。

## 编译期初始化

在编译期初始化的场景下，全局变量的初始值必须在编译时确定，不能是运行时动态生成的。

### 静态常量

特征和具体使用：

1. 关键字是const不是let。
2. 定义时必须指定类型（如i32），不能省略。
3. 命名规则：全局常量的命名规则是全部大写，单词之间用下划线分隔。
4. 其生命周期贯穿整个程序的生命周期，编译时会尽可能内联到代码当中，所以对同一常量的引用并不能保证访问的相同地址。
5. 必须是编译期就可以计算出的值，不能是运行时动态生成的。

### 静态变量

需要去修改静态变量的值是线程不安全的，所以rust中静态变量的修改必须在unsafe代码块中进行。

特征和具体使用：

1. 关键字是static。
2. 添加mut关键字，表示可变的全局变量（只能在unsafe代码块中修改）。
3. 静态变量不会被内嵌，在全局只有一个内存地址。
4. 必须是编译期就可以计算出的值，不能是运行时动态生成的。

### 原子类型

使用到了再回来补充

## 运行时初始化

我们通常可以使用社区提供的`lazy_static`库来实现运行时初始化的全局变量。

比如有一个全局需要使用到的HashMap，使用lazy_static可以在第一次使用时进行初始化。

示例

```rust
use lazy_static::lazy_static;

lazy_static! {
    #[derive(Debug)]
    ref static GlobalMap: HashMap<&'static str, &'static str> = {
        let map = HashMap::new();
        map.insert("key1", "value1");
        map.insert("key2", "value2");
        map
    }
}

fn main(){
    println!("{:?}", GlobalMap);
}

```

## 标准库的全局变量支持

Once和Lazy：rust 1.70以后将Once和Lazy引入了标准库，用于实现全局变量和懒加载。

其实Once和Lazy的功能很相似，都可以封装一个全局变量，区别只是，Once是“一次性初始化”，需要手动初始化；Lazy是“懒加载”，在第一次访问的时候进行自动初始化。

Once和Lazy区分单线程和多线程的使用场景。

||单线程|多线程|
|--|--|--|
|Once|OnceCell|OnceLock|
|Lazy|LazyCell|LazyLock|

### Once

Once与OnceCell/OnceLock：Once只负责执行一次，OnceCell/OnceLock可以存储值并且保证只被设置一次。

```rust
use std::sync::OnceLock;

static NAME_HASH:OnceLock<HashMap<&'static str,&'static str>>=OnceLock::new();

fn init()-> 'static HashMap<&'static str,&'static str>{
    let mut map=HashMap::new();
    map.insert("key1","value1");
    map.insert("key2","value2");
    map
}

fn main(){
    let name_map=NAME_HASH.get_or_init(init);   
    let zero = name_map.get("key1").unwrap();
    println!("{}",zero);
}

// 或者可以直接设置值

let name_hash=NAME_HASH.ste(init_data.clone());
```

### Lazy

Lazy与lazy_static就非常相似了，都是在首次调用的时候才进行初始化，并且只会初始化一次。

```rust
use std::sync::LazyLock;
use std::collections::HashMap;

static NAME_HASH:LazyLock<HashMap<&'static str,&'static str>>=LazyLock::new(||{
    let mut map=HashMap::new();
    map.insert("key1","value1");
    map.insert("key2","value2");
    map
});

fn main(){
    println!("{}",NAME_HASH["key1"]);
}

```
