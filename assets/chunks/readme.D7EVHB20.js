const n=`# RUST中的Struct

## 简要说明

结构体的本质是自定义复合类型，核心作用是封装相关数据，让代码更模块化，可读性更强。
> 有点类似于js语言里面的object？

## 分类

1. 普通结构体
   就类似于js里面的object。
   语法如下：

    \`\`\`rust
    // 定义一个User结构体，封装用户名、年龄、邮箱
    struct User {
        username: String,  // 用户名：拥有所有权的String
        age: u8,           // 年龄：无符号8位整数
        email: String,     // 邮箱：拥有所有权的String
        is_active: bool,   // 是否激活：布尔值
    }

    fn main() {
        // 实例化结构体：按字段名赋值，顺序可任意（推荐和定义顺序一致，可读性强）
        let mut alice = User {
            username: String::from("alice123"),
            email: String::from("alice@example.com"),
            age: 20,
            is_active: true,
        };

        // 访问结构体字段：使用 实例名.字段名
        println!("用户名：{}，邮箱：{}", alice.username, alice.email);
        println!("是否激活：{}", alice.is_active);

        // 修改字段值：必须将实例声明为mut（可变），Rust不支持单独将某个字段设为mut
        alice.age = 21;
        alice.email = String::from("alice_new@example.com");
        println!("修改后年龄：{}，新邮箱：{}", alice.age, alice.email);

        // 实例化不可变结构体：字段无法修改
        let bob = User {
            username: String::from("bob456"),
            email: String::from("bob@example.com"),
            age: 22,
            is_active: false,
        };
        // bob.age = 23; // 报错：不可变变量无法修改
    }
    \`\`\`

    结构体要更新的话，可以使用\`\`..\`\`语法

    \`\`\`rust
    let alice = User {
        username: String::from("alice123"),
        email: String::from("alice@example.com"),
        age: 20,
        is_active: true,
    };

    // 基于alice创建eve，仅修改username和email，复用age和is_active
    let eve = User {
        username: String::from("eve789"),
        email: String::from("eve@example.com"),
        ..alice // 复用alice的剩余所有字段（age、is_active）
    };
    \`\`\`

2. 元组结构体
   将元组和结构体结合的类型，字段没有名称，只有类型，本质是 “有名字的元组”。
   语法如下：

   \`\`\`rust
   // 定义元组结构体：Point（二维坐标，x/y都是i32）、Color（RGB颜色，u8）
    struct Point(i32, i32);
    struct Color(u8, u8, u8);

    fn main() {
        // 实例化：直接传值，顺序必须和定义一致
        let p1 = Point(10, 20);
        let red = Color(255, 0, 0);

        // 访问字段：通过索引访问（和元组一致，从0开始）
        println!("Point坐标：x={}, y={}", p1.0, p1.1);
        println!("红色RGB：R={}, G={}, B={}", red.0, red.1, red.2);

        // 修改字段：实例必须声明为mut
        let mut p2 = Point(0, 0);
        p2.0 = 50;
        p2.1 = 80;
        println!("修改后Point：({}, {})", p2.0, p2.1);

        // 编译器能区分不同的元组结构体（即使类型列表一致）
        let p = Point(1,2);
        let c = Color(1,2,3);
        // let p = Color(1,2,3); // 不会报错，类型不同（Point≠Color）
    }
    \`\`\`

3. 单元结构体
    没有任何字段的结构体，适合标记某个类型（实现特质、作为泛型参数），但无需封装任何数据。

## 核心特性

Rust 中的结构体不仅能封装数据，还能通过 impl 块（实现块） 为其添加行为（方法、关联函数），这是 Rust 实现 “数据和行为绑定” 的核心方式（替代其他语言的 “类方法”）。

\`\`\`rust
struct Point(i32, i32);

// impl块：为Point添加行为，所有方法都写在这里
impl Point {
    // 方法1：计算到原点的距离的平方（只读，&self）
    fn distance_sq_to_origin(&self) -> i32 {
        self.0 * self.0 + self.1 * self.1 // self表示当前Point实例，self.0访问x坐标
    }

    // 方法2：移动坐标（可变，&mut self）
    fn move_by(&mut self, dx: i32, dy: i32) {
        self.0 += dx;
        self.1 += dy;
    }

    // 方法3：消费实例，返回新的坐标（获取所有权，self）
    fn into_tuple(self) -> (i32, i32) {
        (self.0, self.1)
    }
}

fn main() {
    let mut p = Point(3, 4);
    // 调用方法：实例名.方法名()
    println!("到原点距离的平方：{}", p.distance_sq_to_origin()); // 3²+4²=25

    p.move_by(2, 3);
    println!("移动后坐标：({}, {})", p.0, p.1); // (5,7)

    let t = p.into_tuple();
    println!("转换为元组：{:?}", t); // (5,7)
    // println!("{}", p.0); // 报错：p的所有权已被into_tuple获取
}
\`\`\`
`;export{n as default};
