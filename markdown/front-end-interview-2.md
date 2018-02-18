[原文地址](https://github.com/happylindz/blog/issues/11)

# 常见前端面试题总结 (二)

## 一、实现 bind，call，apply



## 二、数组去重

## 三、深拷贝和浅拷贝

首先说浅拷贝，什么是浅拷贝？

对于基本数据类型，无论是深拷贝还是浅拷贝，都会新的赋值，而对于引用类型如：Object，Array 复杂类型，则还是会操作同一块内存数据。

### 实现浅拷贝

实现浅拷贝的方式有很多，如：

```javascript
var copy = { a: 1, b: 2 };

var result1 = Object.assign({}, copy);
var result2 = { ...copy };
```

## 四、 0.1 + 0.2 !== 0.3

第一次接触的人可能会有所疑惑：为何 0.1 + 0.2 !== 0.3，这是一个典型的浮点数精度的问题，JavaScript 的 Number 类型按照 ECMA 的 JavaScript 标准，它的 Number 类型就是 IEEE 754 的双精度数值，相当于 Java 的 double 类型。

按 IEEE 754 格式保存的浮点数精度相当于带有15、16或17位小数位数的十进制小数，由于存在二进制和十进制的转换问题，具体的位数会发生变化。要获得最高的转换精度，必须指定17位的小数——此时可以相信前15位的精度。

因此JavaScript小数在做四则运算时，精度会丢失。在大多数 Web 页面不需要小数，如果要使用小数，可以先百分比放大 100 倍计算以避免出现小数。

## 五、JS 如何管理类中的私有数据？

这个问题挺有意思的，如果你在面试中遇到这样的题目，你不妨反问面试官，你想要 ES5 解法还是 ES6 解法？

首先要明确为什么需要私有化数据？如果在对象上直接暴露出属性，那么被错误修改将导致数据丢失，所以我们希望私有化数据，避免被人修改。那有什么思路来解决私有呢？

1. 数据不暴露
2. 规范私有属性命名
3. 数据需要借助其它 "钥匙" 获取，通过实例对象无法直接获取

下面就开始介绍私有化数据的方法，常见的 ES5 解法有两种：

### 遵循命名约定标记私有变量

这是最简单的办法，将私有变量数据保存在添加了前置下划线命名的属性中，比如：

```javascript
function Person(name, age) {
  this._name = name;
  this._age = age;
}
Person.prototype.getAge = function() {
  return this._age;
}
Person.prototype.getName = function() {
  return this._name;
}
var p = new Person('Lindz', 18);
console.log(p.getName());
console.log(p.getAge());
```

当然这样做最简单，但是也有它的缺点：

1. 并不算严格意义上的私有变量，只能用规范去约束用户代码
2. 私有变量的命名容易出现冲突

### 类构造函数处理私有数据成员

说到底还是因为你将私有变量挂载到 this 上导致了私有变量泄漏，所以可以直接在构造函数里处理私有变量，例如：

```javascript
function Person(name, age) {
  this.getName = function() {
    return name;
  };
  this.getAge = function() {
    return age;
  }
}
var p = new Person('Lindz', 18);
console.log(p.getName());
console.log(p.getAge());
```

至于缺点嘛，可想而知：

1. 需要将所有方法(需要用到私用变量的方法)添加到构造函数中，代码看起来不够优雅
2. 作为实例方法，每次创建都会多浪费内存，如果作为原型方法，则可以共享类方法


如果使用 ES6 的话，常用的方法有两种

### WeakMap 保存私有数据

由于 WeakMap 的设计目的在于键名是对象的弱引用，其所对应的对象可能会被自动回收，只要不暴露 WeakMap ，私有数据就是安全的。

```javascript
const _ageMaps = new WeakMap();
const _nameMaps = new WeakMap();
class Person {
  constructor(name, age) {
    _nameMaps.set(this, name);
    _ageMaps.set(this, age);
  }
  getName() {
    return _nameMaps.get(this);
  }
  getAge() {
    return _ageMaps.get(this);
  }
}
const p = new Person('lindz', 18);
console.log(p.getName());
console.log(p.getAge());
```

在 WeakMap 中以对象作为 key 可以避免私有属性命名冲突，并且也可以共享类原型方法了，只要不暴露 WeakMap，私有数据就是安全的。

### Symbol 保存私有数据

每一个 Symbol 都是唯一的，这就是为什么使用 Symbol 的属性键名之间不会冲突的原因。通过 Symbol 作为属性的键名，这样保证了直接通过实例无法获取数据，除非获取到了这个 Symbol 键。

```javascript
const _age = Symbol('age');
const _name = Symbol('name');
class Person {
  constructor(name, age) {
    this[_name] = name;
    this[_age] = age;
  }
  getName() {
    return this[_name];
  }
  getAge() {
    return this[_age];
  }
}
const p = new Person('lindz', 18);
console.log(p.getName());
console.log(p.getAge());
```

### 私有化数据总结

其实可以看出，无论 WeakMap 保存私有数据还是 Symbol 保存私有数据，要嘛是将数据存储抽离出来，或者将数据的 key 抽离从而导致你无法直接通过实例对象获取私有数据，当然如果你担心 WeakMap、Symbol 也暴露的话大可以多加一层闭包来彻底隔离。

```javascript
function createPerson() {
  const _ageMaps = new WeakMap();
  const _nameMaps = new WeakMap();
  const Person =  function (name, age) {
    _nameMaps[this] = name;
    _ageMaps[this] = age;
  };
  Person.prototype.getName = function() {
    return _nameMaps[this];
  };
  Person.prototype.getAge = function() {
    return _ageMaps[this];
  }
  return Person;
}
const Person = createPerson();
const p1 = new Person('lindz', 18);
console.log(p1.getName());
console.log(p1.getAge());
const p2 = new Person('有酒', 18);
console.log(p2.getName());
console.log(p2.getAge());
```