[原文地址](https://github.com/happylindz/blog/issues/9)

# 常见前端面试题总结 (一)

## 一、W3C 标准盒模型和 IE 盒模型区别：

* W3C 标准盒模型：

盒子的高宽是由盒子的内容区仅由 width, height 决定的，不包含边框，内外边距。

![](https://raw.githubusercontent.com/happylindz/blog/master/images/font-end-interview/1.jpg)

* IE 盒模型：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/font-end-interview/2.jpg)

在 IE 盒模型中，盒子宽高不仅包含了元素的宽高，而且包含了元素的边框以及内边距。

所以在同样的设置下，IE 下的元素会看起来相对于标准盒子来的小，如果你想要标准盒子变为像 IE 盒模型，可以对元素样式进行设置：

```css
.item {
  box-sizing: border-box;      //IE 盒模型效果
  box-sizing: content-box;     //默认值，标准盒模型效果
}
```

## 二、querySelectorAll 与 getElementsBy 系列的区别：

根据该问题下的答案 [querySelectorAll 方法相比 getElementsBy 系列方法有什么区别？](https://www.zhihu.com/question/24702250)，我简单地总结一下：

1. querySelectorAll 属于 W3C 中 Selectors API 规范， 而 getElementsBy 系列则属于 W3C DOM 规范。
2. querySelectorAll 方法接受参数是 CSS 选择符，当传入的是不符合 CSS 选择符规范时会抛出异常，而 getElementsBy 系列则接受的参数是单一的 className，tagName 等等。
3. 从返回值角度来看，querySelectorAll 返回的是不变的结点列表，而 getElementsBy 系列返回的是动态的结点列表。

```javascript
// Demo 1
var ul = document.querySelectorAll('ul')[0],
  lis = ul.querySelectorAll("li");
for(var i = 0; i < lis.length ; i++){
  ul.appendChild(document.createElement("li"));
}

// Demo 2
var ul = document.getElementsByTagName('ul')[0], 
  lis = ul.getElementsByTagName("li"); 
for(var i = 0; i < lis.length ; i++){
  ul.appendChild(document.createElement("li")); 
}
```

因为 Demo 2 中的 lis 是一个动态的结点列表， 每一次调用 lis 都会重新对文档进行查询，导致无限循环的问题。

而 Demo 1 中的 lis 是一个静态的结点列表，是一个 li 集合的快照，对文档的任何操作都不会对其产生影响。

* 普遍认为：getElementsBy 系列性能比 querySelectorAll 好
* querySelectorAll 返回值为一个 NodeList，而 getElementsBy 系列返回值为一个 HTMLCollection

## 三、NodeList 与 HTMLCollection 区别：

1. HTMLCollection 是元素集合而 NodeList 是节点集合(即可以包含元素，文本节点，以及注释等等)。
2. node.childNodes，querySelectorAll(虽然是静态的) 返回的是 NodeList，而 node.children 和 node.getElementsByXXX 返回 HTMLCollection。

## 四、动态作用域和静态作用域的区别：

* 静态作用域又称之为词法作用域：即词法作用域的函数中遇到既不是形参也不是函数内部定义的局部变量的变量时，它会根据函数定义的环境中查询。

```javascript
var foo = 1;

function static() {
  console.log(foo);
}

(function() {
  var foo = 2;
   static();
}());
```

JS 的变量是遵循静态作用域的，在上述代码中会打印出 1 而非 2，因为 static 函数在作用域创建的时候，记录的 foo 是 1，如果是动态作用域的话，那么它应该打印出 2。

静态作用域是产生闭包的关键，即它在代码写好之后就被静态决定它的作用域了。

* 动态域的函数中遇到既不是形参也不是函数内部定义的局部变量的变量时，到函数调用的环境去查询

在 JS 中，关于 this 的执行是基于动态域查询的，下面这段代码打印出 1，如果按静态作用域的话应该会打印出 2

```javascript
var foo = 1;

var obj = {
  foo: 2,
  bar: function() {
    console.log(this.foo);
  }
};

var bar = obj.bar;
bar();
```

## 五、数据类型检测方式：

* typeof：使用 typeof 检测数据类型，返回值有：number, string, boolean, undefined, function, object

常见的返回值就不说了，需要注意的是下面的几种情况：

```javascript
console.log(typeof NaN);          //number
console.log(typeof typeof typeof function(){})      //string
var str = 'abc';     
console.log(typeof str++);         //number
console.log(typeof ('abc' + 1));   //string


console.log(typeof null);          //object
console.log(typeof /\d/g);         //object
console.log(typeof []);            //object
console.log(typeof new Date());    //object
console.log(typeof Date());        //string
console.log(typeof Date);          //function
```

* instanceof：只要在当前实例的原型链上，用 instanceof 检测出来的结果都是 true，所以在类的原型继承中，最后检测出来的结果未必是正确的。

### 使用 instanceof 判断基本类型：

```javascript
var str1 = 'abc';
var str2 = new String('abc');

console.log(str1 instanceof String);                //false
console.log(str2 instanceof String);                //true

console.log(false instanceof Boolean);              //false
console.log(new Boolean(false) instanceof Boolean)   //true
```
判断基本类型还是用 typeof 吧，instanceof 不适合。

### 判断实例：

```javascript
function Foo(){} 
var foo = new Foo(); 
console.log(foo instanceof Foo)     //true
```

### 判断继承关系：

```javascript
function Parent() {}
function Child() {}

Child.prototype = new Parent();
Child.prototype.constructor = Child;

var child = new Child();
console.log(child instanceof Child);             //true
console.log(child instanceof Parent);            //true
console.log(child instanceof Object);            //true
console.log(Child instanceof Function);          //true
console.log(Function instanceof Object);         //true 
console.log(Child instanceof Child);             //false
```

如果你对上面输出的结果感到困惑，那建议你看下这面这篇文章：[深入理解javascript原型和闭包（5）--instanceof - 王福朋 - 博客园](http://www.cnblogs.com/wangfupeng1988/p/3979533.html)

* constructor：检测数据类型

```javascript
console.log((1).constructor === Number);        //true
console.log("a".constructor === String);        //true
console.log([].constructor  === Array);         //true
console.log({}.constructor  === Object);        //true
```

检测功能还是挺全面的，不过也有它的局限性：如果我们把类的原型进行重写了，在重写的过程中，很有可能把之前 constructor 给覆盖掉，这样检测出的结果就不准确了。

```javascript
function Fn() {}
Fn.prototype = new Array();
var f = new Fn();
console.log(f.constructor === Array);                // true
```

并且 constructor 检测不出 null，undefined 的类型，所以判断类型用 constructor 也不太好用

* Object.prototype.toStrong.call

Object.prototype.toStrong.call() 是检测数据类型最准确最常用的方式，

```javascript
function toString(data) {
	return Object.prototype.toString.call(data).slice(8, -1);
}

console.log(toString('abc') === 'String'); 
console.log(toString(1) === 'Number');
console.log(toString(false) === 'Boolean');
console.log(toString(null) === 'Null');
console.log(toString(undefined) === 'Undefined');
console.log(toString([]) === 'Array');
console.log(toString({}) === 'Object');
console.log(toString(function(){}) === 'Function')
```

## 六、函数和对象的关系：

首先函数是一种对象：

```javascript
var fn = function() {}
console.log(fn instanceof Object);  //true
```

对，函数是一种对象，但是函数却不像数组那样 ---- 你可以说数组是对象的一种，因为数组就像对象的一个子集一样，但是函数与对象之间，却不仅仅是包含和被包含的关系。

对象可以由函数创建：

```javascript
function Fn() {
  this.name = "Lindz";
  this.year = 1995;
}
var fn1 = new Fn();      // {name: "Lindz", year: 1995}
```

上面的例子很简单，它说明了对象可以通过函数重建，但是其实对象都是通过函数创建的，有人可能会反驳，他认为：

```javascript
var obj = { a: 10, b: 20 };
var arr = [5, true, "aa"];
```

但是这些都是编程中的语法糖，实际上编译器帮我们做了下面这些事：

```javascript
var obj = new Object();
obj.a = 10;
obj.b = 20;

var arr = new Array();
arr[0] = 5;
arr[1] = true;
arr[2] = "aa";

console.log(typeof (Object));  // function
console.log(typeof (Array));  // function
```

## 七、JS 如何判断函数是 new 调用还是普通调用

第一种方式：通过 instanceof 判断

```javascript
function Person() {
  if(this instanceof arguments.callee) {
	  console.log('new 调用');
  }else {
    console.log('普通调用');
  }
}

let p1 = new Person();             // new 调用
let p2 = Person();		           // 函数调用 
```

第二种方式：通过 constructor

```javascript
function Person() {
  if(this.constructor === arguments.callee) {
    console.log('new 调用');
  }else {
    console.log('普通调用');
  }
}

let p1 = new Person();             // new 调用
let p2 = Person();		   			// 函数调用 
```

