# 架构分层

主体架构分为三层Controller层、Service层、Repository层。

## Controller层

接收http响应和返回数据：解析请求数据，调用下一层service层的处理函数，返回结果，将结果转化为http响应。

## Service层

逻辑处理层：这是主要的核心业务逻辑，处理业务逻辑，调用下一层repository层，返回结果。

## Repository层

数据访问层：这是主要的数据访问逻辑，与数据库进行交互，处理数据访问逻辑，返回结果。

## 其他

dto与models定义在其他文件。
