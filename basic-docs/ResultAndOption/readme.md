# Result and Option

## 介绍

    * Result<T,E>

    表示一个可能操作成功(`Ok(T)`)，也可能操作失败(`Err(E)`)。专注于**成不成功**。

    * Option<T>

    表示一个值可能存在(`Some(T)`)，也可能不存在(`None`)。专注于**有无值**。

## 通用方法

1. 状态检查

   * `is_ok()`/`is_err()`：检查 Result 的状态。
   * `is_some()`/`is_none()`：检查 Option 的状态。
   * `is_ok_and()`/`is_err_and()`: 检查 Result 的状态，并对 Ok/Err 的值进行自定义条件判断。
   * `is_some_and()`/`is_none_and()`: 检查 Option 的状态，并对 Some/None 的值进行自定义条件判断。

   > 带有`_and`的方法可以在检查状态的同时对值进行条件判断，返回布尔值。

   例子：

   ```rust
   let result: Result<i32, &str> = Ok(10);
   assert!(result.is_ok());
   assert!(!result.is_err());
   assert!(result.is_ok_and(|x| x > 5));
   assert!(!result.is_err_and(|x| x < 5)); 
   ```

   ```rust
   let option: Option<i32> = Some(10);
   assert!(option.is_some());
   assert!(!option.is_none());
   assert!(option.is_some_and(|x| x > 5));
   assert!(!option.is_none_and(|x| x < 5));

    ```

2. 直接取值（需要谨慎使用，可能造成程序崩溃）

   * `unwrap()`：如果是 Some/Ok 则返回内部值，否则会 panic 并使程序崩溃。
   * `expect(msg)`：如果是 Some/Ok 则返回内部值，否则会 panic 并输出自定义错误信息。
   * `unwrap_or(value)`：如果是 Some/Ok 则返回内部值，否则返回默认值。
   * `unwrap_or_default()`：如果是 Some/Ok 则返回内部值，否则返回默认值（需要实现 Default 特征）。
   * `unwrap_or_else(fn)`：如果是 Some/Ok 则返回内部值，否则返回 f() 的返回值。

   > 千万要注意谨慎使用`unwrap()`和`expect()`，因为它们会在错误情况下直接 panic，导致程序崩溃。建议在不确定的情况下使用`unwrap_or`、`unwrap_or_default`或`unwrap_or_else`来提供默认值或处理逻辑。

3. 链式调用

   * `and_then(fn)`：如果值是 Some/Ok，对其应用一个返回 Option/Result 的函数fn。这常用于串联多个可能失败的操作。
   * `or_else(fn)`：如果值是 None/Err，对其应用一个返回 Option/Result 的函数fn。这常用于处理错误。

4. 相互转化

    `Result<T,E>`和`Option<T>`之间可以相互转化。

    * `Option<T>`转为`Result<T,E>`：使用`ok_or()`方法，如果 Option 的值为 Some，则返回 Ok(T)，否则返回自定义的错误 Err(E)。
    * `Result<T,E>`转为`Option<T>`：使用`ok()`方法，如果 Result 的值为 Ok，则返回 Some(T)，否则返回 None。

5. `?`运算符

    `?`运算符可以在函数中处理错误，并返回错误给调用者。但是请注意：
    >? 运算符所作用的类型，必须与当前函数返回的包裹类型（Wrapper）严格匹配。
    >在返回 Result 的函数里，? 只能作用于 Result。
    >在返回 Option 的函数里，? 只能作用于 Option。
