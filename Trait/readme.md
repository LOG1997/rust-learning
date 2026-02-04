# Rust中的Trait

## 简要说明

定义一组行为规范，让多个类型实现。实现了该trait的类型，都可以拥有这组行为。类似于ts中的interface吧。

## 特性

    1. 行为抽象：不关心类型的具体实现，只定义类型可以做什么。
    2. 实现约束；一个类型要实现某个trait，必须实现这个trait的所有方法(无默认实现的方法必须由实现者实现)。
    3. 孤儿规则：只能为两种情况的类型实现trait：类型是自己定义的/trait是自己定义的
    4. trait约束：通过trait限制泛型、函数参数、返回值的类型范围。

## 使用方法

1. 定义trait，使用trait关键字，其中trait内定义的方法，默认传入的参数为&self。需要传入多个参数，则在后面添加参数即可。self代表这个trait本身，要使用trait内的方法直接使用self调用即可。

    ```rust
    // 定义一个名为 Printable 的 trait，代表“可打印”的行为
    trait Printable {
        // 定义一个无默认实现的方法，必须由实现者实现
        fn print(&self);

        // 定义一个有默认实现的方法，实现者可重写，也可直接使用
        fn print_with_note(&self, note: &str) {
            // 默认实现可以调用同 trait 的其他方法
            println!("[{}] ", note);
            self.print();
        }
    }
    ```

2. 实现trait：使用impl关键字

    ```rust
    // 自定义类型1：Person
    #[derive(Debug)]
    struct Person {
        name: &'static str,
        age: u8,
    }

    // 为 Person 实现 Printable trait
    impl Printable for Person {
        // 必须实现无默认的 print 方法
        fn print(&self) {
            println!("Person: {}-{}岁", self.name, self.age);
        }

        // 可选重写默认的 print_with_note 方法（这里重写演示）
        fn print_with_note(&self, note: &str) {
            println!("【{}】{}，年龄{}", note, self.name, self.age);
        }
    }

    // 自定义类型2：Book
    #[derive(Debug)]
    struct Book {
        title: &'static str,
        author: &'static str,
    }

    // 为 Book 实现 Printable trait
    impl Printable for Book {
        // 实现 print 方法
        fn print(&self) {
            println!("Book: 《{}》- 作者{}", self.title, self.author);
        }
        // 不重写 print_with_note，直接使用默认实现
    }
    ```

3. 使用trait：直接调用/约束泛型
   (1). 直接调用就是类型实现trait过后，直接通过实例调用方法，和普通方法一致。
   (2). 如果需要一个函数能处理所有实现了某 trait 的类型，可以用trait 约束限制泛型，语法：泛型名: 特质名1 + 特质名2（多个 trait 用 + 连接）。

   ```rust
   // 定义一个泛型函数，只接受实现了 Printable trait 的类型
    fn print_anything<T: Printable>(item: T) {
        item.print();
        item.print_with_note("通用打印");
    }

    fn main() {
        let p = Person { name: "张三", age: 20 };
        let b = Book { title: "Rust 编程", author: "张三" };

        // 同一个函数，处理 Person 和 Book 类型
        print_anything(p);
        print_anything(b);
    }
    ```

4.`where`子句，简化trait的约束（但是我觉得使用where会更不美观呢）

    ```rust
    // 原始写法（约束多了会乱）
    // fn process<T: Printable + Debug, U: Clone + Copy>(t: T, u: U) {}

    // where 子句写法（更清晰）
    fn process<T, U>(t: T, u: U)
    where
        T: Printable + std::fmt::Debug, // 多个trait用+连接
        U: Clone + Copy,
    {
        println!("{:?}", t); // 因为T实现了Debug
        t.print();
    }
    ```

## 进阶特性

1. 关联类型
   解决泛型trait的多次实现的冗余问题，为trait定义一个“占位类型”，然后在实现trait的时候指定具体类型，一个类型对一个 trait 只能指定一次关联类型（和泛型 trait 互补）。
   使用场景：当 trait 的行为和某个类型强绑定，且一个实现者只需要一种绑定类型时，用关联类型。

   ```rust
   // 定义一个迭代器特质（类似Rust标准库的Iterator）

    trait MyIterator {
        // 定义关联类型：Item，代表迭代器返回的元素类型（占位）
        type Item;

        // 方法返回关联类型Item
        fn next(&mut self) -> Option<Self::Item>;
    }

    // 自定义迭代器：遍历1到n的整数
    struct Counter {
        current: u32,
        max: u32,
    }

    // 为Counter实现MyIterator，指定关联类型Item为u32
    impl MyIterator for Counter {
        type Item = u32; // 绑定具体类型

        fn next(&mut self) -> Option<Self::Item> {
            if self.current < self.max {
                self.current += 1;
                Some(self.current)
            } else {
                None
            }
        }
    }

    fn main() {
        let mut counter = Counter { current: 0, max: 3 };
        println!("{:?}", counter.next()); // Some(1)
        println!("{:?}", counter.next()); // Some(2)
        println!("{:?}", counter.next()); // Some(3)
        println!("{:?}", counter.next()); // None
    }
    ```

2. 作为返回值：函数返回任意实现了某trait的类型（编译期无法确定类型），需要使用trait object（特征对象）。
   语法为：`Box<dyn Trait>` 或 `&dyn Trait`（dyn 表示 “动态的” trait）。
   使用场景：使用trait作为返回值
   trait object 是动态分发（运行期确定具体类型，有轻微的性能开销），且要求trait是对象安全的（不能返回Self，不能有泛型参数）

    ```rust
    // 函数返回“任意实现了Printable的类型”，用Box<dyn Printable>
    fn create_printable(is_person: bool) -> Box<dyn Printable> {
        if is_person {
            Box::new(Person { name: "李四", age: 25 })
        } else {
            Box::new(Book { title: "Rust进阶", author: "李四" })
        }
    }

    fn main() {
        let p = create_printable(true);
        p.print(); // 输出：Person: 李四-25岁

        let b = create_printable(false);
        b.print(); // 输出：Book: 《Rust进阶》- 作者李四
    }
    ```

3. 为trait实现trait（trait的继承）
   语法：trait B: A实现trait继承，子trait会继承父trait的所有行为，实现子trait的类型必须先实现父trait。
   使用场景：定义更具体的行为，基于基础行为扩展。

   ```rust
   // 父trait：可打印
    trait Printable {
        fn print(&self);
    }

    // 子trait：可打印且可格式化打印，继承Printable
    trait Formattable: Printable {
        fn format_print(&self, fmt: &str) {
            println!("{}", fmt);
            self.print(); // 调用父trait的方法
        }
    }

    // 先为Person实现父trait Printable
    impl Printable for Person {
        fn print(&self) {
            println!("{}", self.name);
        }
    }

    // 再为Person实现子trait Formattable（无需实现父方法）
    impl Formattable for Person {}

    fn main() {
        let p = Person { name: "张三", age: 20 };
        p.format_print("姓名："); // 输出：姓名：\n张三
    }
    ```

4. 通用trait（rust标准内置库）
   Rust 标准库提供了大量常用 trait作为宏，可直接为自定义类型实现，无需自己定义，核心有：
    Debug/Display：实现打印（println!("{:?}", x)/println!("{}", x)），可通过 #[derive(Debug)] 自动实现；
    Clone/Copy：实现复制（x.clone()/ 直接赋值），可通过 #[derive(Clone, Copy)] 自动实现；
    PartialEq/Eq：实现相等比较（==/!=），可通过 #[derive(PartialEq)] 自动实现；
    PartialOrd/Ord：实现大小比较（>/</>=/<=），可通过 #[derive(PartialOrd)] 自动实现；
    Default：实现默认值（T::default()），可通过 #[derive(Default)] 自动实现。

## 使用场景

1. 抽象通用行为
2. 泛型约束
3. 动态多态
4. 代码复用：让多个类型共享同一套方法逻辑，避免重复代码。
5. 扩展类型行为：在满足孤儿前提的情况下，为第三方类型实现自己的trait（比如为 i32 实现自定义的 MyMath trait，增加加减乘除的扩展方法）。
