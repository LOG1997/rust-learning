# 多线程

编写代码过程中，可能会遇到需要并行执行两个或多个任务的场景，这就要使用到多线程并发编程。

## 基础使用

### 创建线程

使用rust自带的多线程模型，使用`thread::spawn`可以创建线程：

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }
}
```

需要注意几个点：

1. 主线程结束，子线程随之结束

2. 线程内部代码使用闭包执行

### 等待子线程结束

有些时候可能需要等待子线程结束后再结束主线程。

通过调用`handle.join`，可以让当前线程阻塞，直到它等待的子线程的结束。

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..5 {
            println!("hi number {} from the spawned thread!", i);
            thread::sleep(Duration::from_millis(1));
        }
    });

    handle.join().unwrap();

    for i in 1..5 {
        println!("hi number {} from the main thread!", i);
        thread::sleep(Duration::from_millis(1));
    }
}
```

### 线程消息传递

标准库中提供了线程通信的通道`std::sync::mpsc`，`tx`和`rx`对应发送者和接收者，使用方法如下：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // 创建一个消息通道, 返回一个元组：(发送者，接收者)
    let (tx, rx) = mpsc::channel();

    // 创建线程，并发送消息
    thread::spawn(move || {
        // 发送一个数字1, send方法返回Result<T,E>，通过unwrap进行快速错误处理
        tx.send(1).unwrap();
    });

    // 在主线程中接收子线程发送的消息并输出
    println!("receive {}", rx.recv().unwrap());
}
```

请注意线程间通信时，未实现`Copy`特征的值，传输时会将所有值一并转移。

如果是多发送者的情况，必须对发送者`tx`进行克隆，让每个线程都拿走一份拷贝。

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    let tx1 = tx.clone();
    thread::spawn(move || {
        tx.send(String::from("hi from raw tx")).unwrap();
    });

    thread::spawn(move || {
        tx1.send(String::from("hi from cloned tx")).unwrap();
    });

    for received in rx {
        println!("Got: {}", received);
    }
}
```

关于异步编程，具体信息可以参看rust的异步运行时框架[tokio官网](https://tokio.rs/tokio/tutorial)或者[tokio crate](https://crates.io/crates/tokio)或者[tokio github](https://github.com/tokio-rs/tokio)。

本项目关于tokio亦有整理，[点击跳转](../tokio/readme.md)
