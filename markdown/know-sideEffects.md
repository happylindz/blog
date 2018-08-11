# 深入浅出 sideEffects

[原文地址](https://github.com/happylindz/blog/issues/15)

## 前言

最近在给团队对 webpack 中的 sideEffects 字段用途进行微分享，于是乎，我最后就整理成一篇文章，希望帮助更多的人理解 sideEffects 的作用。

sideEffects 是什么呢？我用一句话来概括就是：让 webpack 去除 tree shaking 带来副作用的代码。

听起来有点绕口，让我们划出重点：tree shaking/用法/副作用

## tree shaking

tree shaking 是一种代码优化技术，它能够将无用的代码进行去除，下面举个简单的例子：

```javascript
// a.js
export const a = 'a';
export const b = 'b';    // 不导出，删除
export const c = 'c';    // 导出不引用，删除
// index.js 
import { a, c } from './a.js'; 
console.log(a);
if(false) {             // 不会执行的代码，删除
  console.log('去除我');  
}
```

可以从上面简单的例子看出：在 webpack 编译阶段 tree shaking 会将未被使用的代码删除，简单总结一下：

1. tree shaking 是基于 ES6 模块机制，意味着如果你引用不同的文件就需要遵循 ES6 的模块规范。
2. webpack 在编译阶段会去除那些只读不写或者是不会被执行的代码。

## 使用方法

想使用 sideEffects，你的 webpack 的版本号要大于等于 4。那具体应该怎么用呢，如果你在写一个第三方的 npm 模块，sideEffects 支持下面两种写法：

```javascript
// package.json
{
    "sideEffects": false
}
// antd package.json
{
  "sideEffects": [
    "dist/*",
    "es/**/style/*",
    "lib/**/style/*"
  ]
}
```

如果你想要对你的业务代码生效，那你可以再 module.rules 里面添加，比如:

```javascript

module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        },
        sideEffects: false || []
      }
    ]
  },
}
```

sideEffects 支持两种写法，一种是 false，一种是数组

* false 为了告诉 webpack 我这个 npm 包里的所有文件代码都是没有副作用的
* 数组则表示告诉 webpack 我这个 npm 包里指定文件代码是没有副作用的

webpack 在编译就会去读取这个 sideEffects 字段，如果有的话，它就会将所有引用这个包的副作用代码或者自身具有副作用的业务代码给去除掉。

## 副作用：

说了这么多，那什么是有副作用的代码呢？简单说来就是 JS 引用类型属性读/写所带来的副作用，看完下面这个简单的例子你就明白了。

```javascript
var x = {};
Object.defineProperty(x, "a", {
    get: function(val) {
        window.x = 'a';
        return val;
    }
});
function getA ( x ) {
	return x.a
}
getA(x);
console.log(window.x);     // a
```

x 在获取 a 属性的同时在 window 对象上挂载了 x 字段，跟属性 setter 同理，JS 引用属性的 getter 和 setter 其实是不透明的，webpack 身为保守派，对于这类的代码就会选择保留。

这也是为什么 webpack 对于 ES6 class 类型处理糟糕的原因，在 babel 转义 class 类的时候会有很多 setter 的操作：

```javascript
class Person {
  constructor ({ name, age, sex }) {
    this.className = 'Person'
    this.name = name
    this.age = age
    this.sex = sex
  }
  getName () {
    return this.name
  }
}
// 分割线

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0,
      "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps),
    Constructor;
  };
}()

var Person = function () {
  function Person(_ref) {
    var name = _ref.name, age = _ref.age, sex = _ref.sex;
    _classCallCheck(this, Person);

    this.className = 'Person';
    this.name = name;
    this.age = age;
    this.sex = sex;
  }

  _createClass(Person, [{
    key: 'getName',
    value: function getName() {
      return this.name;
    }
  }]);
  return Person;
}();
```

在一个简单的 class 中，会有一个立即执行函数，里面对对象属性进行 set 操作。

### 副作用带来的影响

举个很常见的例子，一般我们在项目里写代码的时候会区分开发环境和生产环境，比如开发阶段会引入一些调试工具包，如：

```javascript
import DevTools from 'mobx-react-devtools';
class MyApp extends React.Component {
  render() {
    return (
      <div>
        ...
        { process.env.NODE_ENV === 'production' ? null : <DevTools /> }
      </div>
    );
  }
}
```

乍一看，还以为如果生产环境下 ```mobx-react-devtools``` 就完全不会被引入了，但其实如果没有 sideEffects 的话 ```mobx-react-devtools``` 并没有被完全移除，里面的副作用代码仍然是会被引入的。

## 使用场景：

什么时候应该加上？我也不确定自己写的 npm 模块到底有没有副作用？

我们基本能确保这个包是否会对包以外的对象产生影响，比如是否修改了 window 上的属性，是否复写了原生对象 Array, Object 方法。如果我们能保证这一点，其实我们就能知道整个包是否能设置 ```sideEffects: false``` 了

## 总结

webpack 的 tree shaking 依赖于 babel编译 + UglifyJS 压缩，这个过程是没有完善的程序流分析，UglifyJS 没有完善的程序流分析。它可以简单的判断变量后续是否被引用、修改，但是不能判断一个变量完整的修改过程，不知道它是否已经指向了外部变量，所以很多有可能会产生副作用的代码，都只能保守的不删除。

tree shaking 处理代码的类型：

1. 自身业务代码：先 es6 模块进行 tree shaking 打包，然后在压缩代码
2. npm 包模块：一般会提供两种版本：提供 es6 模块机制的 babel 编译后的文件(ps: 工程化项目的 babel 编译配置，为了提高编译速度，其实是会忽略掉 node_modules 内的文件编译)

在 webpack4 发布之前，tree shaking 在处理第三方 npm 模块时候一般是这么做的：

```javascript
// antd package.json
{
  "name": "my-package",
  "main": "dist/my-package.umd.js",
  "module": "dist/my-package.esm.js"
}

// webpack.config.jss
module.exports = {
  resolve: {
    mainFields: ['browser', 'module', 'main'], // 设置主入口
  },
};
```

这样 webpack 在引用 antd 组件的时候就会优先去加载 es 的入口文件，

```javascript
// antd 入口
export Button from './es/button';
export Message from './es/message';
export Row from './es/row';

// index.js
import { Row } from 'antd';
```

但是这么做的话虽然 webpack 可以找到 Row 对应的入口模块，然后不打包其它组件(Button，Message)等，其它组件虽然没被打包，但是它们产生的副作用的代码却被保留下来了，所以有个 hack 的方法就是通过引入 ```babel-plugin-import``` 将模块路径进行替换。

```javascript
import { Button, Message } form 'antd';
// 转换
import Button from 'antd/lib/button';
import Message from 'antd/lib/button';
```

这样其它没被引用的组件，因为不经过 antd 主入口组件映射，其它组件带来的副作用代码就没被引入了。当然你引入的组件文件里面可能存在一些副作用代码，那就会被保留了。

现在有了 webpack4 事情就变得很简单了，直接在第三方模块里面加上 ```sideEffects: false```，webpack 在读取到 es 入口的时候，没被引用到的文件就完完全全不会被引入了，不用使用 ```babel-plugin-import``` 进行 hack 了。

## 参考链接

* [你的Tree-Shaking并没什么卵用](https://zhuanlan.zhihu.com/p/32831172)
* [Webpack 中的 sideEffects 到底该怎么用？](https://zhuanlan.zhihu.com/p/40052192)

