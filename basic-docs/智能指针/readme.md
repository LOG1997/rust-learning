# 智能指针

## 概念

什么是rust的智能指针？

首先需要清楚指针是什么，在初学的时候就学过指针，指针就是只想数据的一个**内存地址**。通过指针这个地址可以获取到存储在内存中的数据。

那么显而易见rust中的智能指针就知道是什么了：首先智能指针存储了内存地址，指向内存中的具体数据；而“智能”两个字体现在哪呢，rust的智能指针不仅存储了数据的内存地址，还额外存储了元数据（引用计数、堆内存等）。

所以给出详细的概念：智能指针不仅指向数据，还拥有数据的所有权，附加了额外的元数据和功能。

有以下智能指针是经常用到的：
`Box<T>`,`Rc<T>`/`Arc<T>`,`RefCall<T>`/`Mutex<T>`,`Weak<T>`

## `Box<T>`

1. `Box<T>`智能指针最常用的功能是将数据存储到堆上，这样做有什么优势呢？
  a. 转移数据所有权时，仅仅只是复制一份存在栈里面的指针，再将新的指针赋值给新的变量，不涉及数据的拷贝，性能更好。

  b. 将动态大小的类型转为`Sized`固定大小的类型，比如一个树形的数据类型，其节点的深度是无法确定的，可以无限进行下去，如果直接定义rust编译器就会报错，但是只需要把List存储到堆上，使用一个智能指针指向它，就可以完成到固定长度类型的转换，这是因为`Box<T>`只是一段内存地址而已。

  ```rust
  enum List {
      Cons(i32, Box<List>),
      Nil,
  }
  ```
  
  c. 特征对象：实现将不同的类型组成数组，为什么可以这样呢，因为Box只是一段内存的地址而已。
  
  ```rust
  trait Draw {
      fn draw(&self);
  }
  
  struct Button {
      id: u32,
  }
  impl Draw for Button {
      fn draw(&self) {
          println!("这是屏幕上第{}号按钮", self.id)
      }
  }
  
  struct Select {
      id: u32,
  }
  
  impl Draw for Select {
      fn draw(&self) {
          println!("这个选择框贼难用{}", self.id)
      }
  }
  
  fn main() {
      let elems: Vec<Box<dyn Draw>> = vec![Box::new(Button { id: 1 }), Box::new(Select { id: 2 })];
  
      for e in elems {
          e.draw()
      }
  }
  ```

2. `Rc<T>`和`Arc<T>`，共享所有权，允许数据拥有多个所有者。其中`Rc<T>`适用于单线程，`Arc<T>`适用于多线程。使用到了再来进行补充。

3. `RefCell<T>` 与 `Mutex<T>`

4. `Weak<T>`——解决循环引用。
