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

## 锁

### 互斥锁（Mutex）和原子引用计数（Arc）

Mutex和Arc经常配合起来使用，用于多线程并发访问数据。

* Mutex：互斥锁，保证同一时间只有一个线程访问数据。
* Arc：原子引用计数，允许多个所有者共享同一份数据。

使用`Mutex`创建一份共享数据，需要访问数据时，使用`lock()`方法获取锁，并返回一个`MutexGuard`对象，该对象实现了`Deref` trait，因此可以使用`*`运算符访问数据。

> 同一时间只允许一个线程访问该值，其他线程访问需要等待别的线程访问后才能继续。

<span style="background-color: yellow;padding:3px 4px">请默写一份代码，使用Mutex和Arc在多个线程中对计数器+1，知道循环结束。</span>

### 死锁

死锁是指多个线程互相等待对方释放锁，导致无法继续执行。

详细过程：
条件：
有两把锁：锁A和锁B；两个线程：线程1和线程2。

1. 线程1获取锁A，线程2获取锁B。（几乎同时获取）
2. 线程1去获取锁B，线程2去获取锁A，互相索要对方线程持有的锁，但是两个锁都被对应线程持有无法解锁（因为线程1需要获取锁B才能完成工作释放锁A，线程2需要获取锁A才能完成工作释放锁B）。

双方都在等待对方释放锁，导致程序无法继续执行。

**解决方法**：

可以使用try_lock方法来尝试获取锁，如果获取锁失败则返回错误，不会阻塞代码执行。

### 读写锁（RwLock）

RwLock是一种读写锁，它可以同时允许多个线程读，但只能有一个线程写。

### 信号量（Semaphore）

Semaphore是一种信号量，它可以限制当前正在运行的任务的最大数量。因为标准库中的Semaphore不稳定所以不推荐使用，推荐的是使用 `tokio::sync::Semaphore`.

使用`Semaphore::new(n)`创建一个信号量，其中n是信号量的最大数量。

执行任务需要使用`Semaphore::acquire()`获取一个信号量，获取成功后任务才能继续执行，未获取到需要等待。

如果需要跨线程传递信号量，可以使用`Arc<Semaphore>`，然后使用`acquire_owned()`方法获取信号量。

示例代码：

```rust
use std::sync::Arc;
use tokio::sync::Semaphore;

#[tokio::main]

async fn main() {
    let semaphore = Arc::new(Semaphore::new(3));
    let mut join_handles = Vec::new();

    for i in 0..10 {
        let permit = semaphore.clone().acquire_owned().await.unwrap();

        join_handles.push(tokio::spawn(async move {
            // 在这里执行任务...
            println!("dooooo :{}", i);
            drop(permit);
        }));
    }
    for handle in join_handles {
        handle.await.unwrap();
    }
}

```
