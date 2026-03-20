# RUST中的泛型

## 简要介绍

泛型的本质是类型参数化：把代码中的具体类型替换成类型占位符，使用时再传入具体的类型，编译器会在编译期为每个传入的类型生成专属代码（单态化），运行时完全没有额外开销

> 但是每个类型都有专属代码，这样会造成变异体积增大吧。

## 使用场景和方法

1. 泛型函数：让函数适配多种参数类型
    语法如下：

    ```rust
    // 声明类型参数T，函数参数x的类型为T
    fn print_anything<T>(x: T) {
        println!("值为: {}", x);
    }

    fn main() {
        print_anything(100);    // T=i32，编译器自动推导
        print_anything(3.14);   // T=f64
        print_anything("Rust"); // T=&str
        print_anything(String::from("泛型")); // T=String
    }
    ```

2. 泛型结构体：声明时在结构体名后加类型参数，字段的类型可以使用该参数，实例化时指定具体类型即可。
    语法如下：

    ```rust
    // 泛型结构体：字段value的类型为T
    struct Wrapper<T> {
        value: T,
    }

    // 两个类型参数：a=T，b=U
    struct Pair<T, U> {
        a: T,
        b: U,
    }

    fn main() {
        // 实例化1：T=i32
        let int_wrap = Wrapper { value: 42 };
        // 实例化2：T=String
        let str_wrap = Wrapper { value: String::from("Hello Generics") };
        // 实例化3：T=Vec<i32>
        let vec_wrap = Wrapper { value: vec![1,2,3] };

        let p1 = Pair { a: 1, b: "rust" }; // T=i32, U=&str
        let p2 = Pair { a: 3.14, b: vec![0,1] }; // T=f64, U=Vec<i32>

        println!("int: {}, str: {}, vec: {:?}", int_wrap.value, str_wrap.value, vec_wrap.value);
    }
    ```

3. 泛型枚举：
    核心库中的`Option<T>`和`Result<T, E>`都是基于泛型实现的。自定义泛型枚举的话

    ```rust
    enum MyEnum<T, U> {
        Num(T),
        Str(U),
    }

    fn main() {
        let e1 = MyEnum::Num(123); // T=i32, U=()（自动推导）
        let e2 = MyEnum::Str("abc"); // T=(), U=&str
    }
    ```

4. 泛型trait（泛型特征）：
    a. trait中的泛型方法，只在trait中的方法中声明。

    ```rust
    trait Print {
        // 方法的泛型：接收任意类型T的参数
        fn print_with<T>(&self, other: T);
    }

    // 为i32实现Print特质
    impl Print for i32 {
        fn print_with<T>(&self, other: T) {
            println!("自身值：{}, 附带值：{}", self, other);
        }
    }

    fn main() {
        let num = 42;
        num.print_with("rust"); // T=&str
        num.print_with(3.14);   // T=f64
    }
    ```

    b. 泛型trait本身：在特质名后声明类型参数，整个特质的方法都可以使用该参数，适合特质和具体类型强绑定的场景：
    > 不懂，不知道怎么使用

    ```rust
    // 泛型特质：表示“容器”，包含一个获取值的方法
    trait Container<T> {
        fn get(&self) -> &T;
    }

    // 为之前的Wrapper<T>实现Container<T>特质
    impl<T> Container<T> for Wrapper<T> {
        fn get(&self) -> &T {
            &self.value
        }
    }

    fn main() {
        let wrap = Wrapper { value: String::from("泛型容器") };
        println!("容器中的值：{}", wrap.get()); // 调用泛型特质的方法
    }
    ```

## 泛型约束

泛型默认是无约束的，所以某些特性比如+、=等操作编译器会报错，这时就需要使用泛型约束（Trait Bound）。告诉编译器，只有实现了指定特质的类型，才能作为这个泛型参数的具体类型。

1. 基础 Trait Bound 语法
在类型参数后用 : 跟特质名，声明格式：<T: 特质1 + 特质2>（多个特质用 + 连接）。

    ```rust
    // 约束T必须实现std::ops::Add特质，且Add的输出类型也是T
    use std::ops::Add;
    fn add<T: Add<Output = T>>(a: T, b: T) -> T {
        a + b
    }

    fn main() {
        println!("1+2={}", add(1,2)); // T=i32，实现了Add
        println!("1.1+2.2={}", add(1.1,2.2)); // T=f64，实现了Add
        // add("a", "b"); // 报错：&str未实现Add特质，不满足约束
    }
    ```

2. 使用where子句，抽离泛型约束

    ```rust
    use std::fmt::Display;
    use std::ops::Add;

    // 无where子句：约束写在尖括号里，冗长
    fn complex_func<T: Add<Output = T> + Display, U: Display>(a: T, b: T, c: U) {
        println!("a+b={}, c={}", a + b, c);
    }

    // 有where子句：约束抽离，签名更清晰
    fn complex_func_where<T, U>(a: T, b: T, c: U)
    where
        T: Add<Output = T> + Display, // T的约束
        U: Display,                   // U的约束
    {
        println!("a+b={}, c={}", a + b, c);
    }

    fn main() {
        complex_func(1,2, "rust");
        complex_func_where(3.14, 2.72, 42);
    }
    ```
