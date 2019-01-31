[原文地址](https://github.com/happylindz/blog/issues/18)

# 动态引入语言包 - 让你的 moment 库更小

## 前言

我们在使用 webpack 打包构建 moment 库的时候，moment 默认会将所有语言包全部引入，这样就会导致打包后的 JS 体积增大，通过 ```webpack-bundle-analyzer``` 分析工具可以看到，如果将所有的 moment 语言包引入的话，所占 JS 体积是相当庞大的。gzip 之后也要占据 65kb 的文件大小。

![](https://img.alicdn.com/tfs/TB1kgYfEQvoK1RjSZPfXXXPKFXa-2706-1440.png)

所以如果应用没有国际化背景的需求下，我们一般都会通过 ```webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)``` 将所有语言包进行剔除，不进行打包，这样打包后的 moment 体积就只有 16kb。

![](https://img.alicdn.com/tfs/TB1lt6GENjaK1RjSZKzXXXVwXXa-3152-1616.png)

正常的业务诉求到这里结束了，但是我们阿里巴巴国际站需要支持 14 种语言的切换(即在站点内支持语种的切换)，如果像下面这这样 14 语言包一起引入的话也会造成体积上的浪费。

```javascript
import moment from 'moment';
import 'moment/locale/zh-cn';
// ...other language file
import 'moment/locale/zh-tw';
moment.locale(window.currentLocale);
```

所以本节的重点在于讲讲如何在像 React/Vue 这样单页应用或者其它多页面应用中实现对 moment 语言包的动态引入，其它库引入语言包的思想也可以借鉴。

## 动态引入 moment 语言包

首先需要编写不同语种的脚本文件入口，比如：

```javascript
// ./locale-zh_cn.js
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');

// ./locale-zh_tw.js
import moment from 'moment';
import 'moment/locale/zh-tw';
moment.locale('zh-tw');
```

在页面打开的时候通过服务端渲染在 html 中注入变量来告诉页面当前的语种脚本。

```html
<script src="/js/locale-${currentLocale}.js"></script>
<script src="/js/main.js"></script>
```

这样做就可以让用户在站点中切换语种是可以保证引入当前语种所需语种包的最小集。

当时这里就产生新的问题，熟悉 webpack 打包机制的同学应该知道 (如果不熟悉可以看我之前写的 [深入理解 webpack 文件打包机制](https://github.com/happylindz/blog/issues/6) ) 

在多入口文件的时候，会有不同的 ```__wepback_require__``` 和 ```installModules```，这就导致了你在不同入口文件中使用 moment 库时，其实实例了两个不同的 moment 对象(即 main.js 和 locale-xxx.js 中使用的 moment 其实不是同一个实例，main 入口就无法使用 locale.js 中注入的语种包)，针对这样的问题，那么有什么办法能让不同的入口使用同一个 moment 实例？

## 巧用 externals 属性

通过在 webpack 配置文件 externals 属性，让 moment 指向 window.moment 并且在页面中额外引入不带语种包的 moment CDN 库。

```javascript
{
    // ...
    externals: {
      "moment": "moment",
      "../moment": "moment"
    },
}
```

不难理解，通过这种方式打包后 webpack 在遇到 ```import moment from 'moment'```时候会直接使用 window.moment，值得一提的是，因为在 moment 内置语种包中通过 ```.../moment``` 来调用 moment 的方法，所以我们也将这个设置为外置引用 window.moment。

```javascript
// node_modules/moment/locale/zh-cn.js
;(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined'
       && typeof require === 'function' ? factory(require('../moment')) :
   typeof define === 'function' && define.amd ? define(['../moment'], factory) :
   factory(global.moment)
}(this, (function (moment) { 'use strict';
    var zhCn = moment.defineLocale('zh-cn', {
        // ...
    }
}
```

这样做有三个好处：

1. 保证了不同入口的业务代码引用到的都是同一个 moment 实例
2. 不需要对已有的代码进行改造，在 import moment 的时候 webpack 都会默认指向 window.moment 变量。
3. 引入 moment 语言包最小集

这样做解决了多页应用或单页面应用在第一次打开时的语种问题，如果用户在单页应用切换语种的话就比较简单，直接使用动态 import 即可。

```javascript
import moment from 'moment';
// 此时已经引入 locale-zh_cn;
console.log(moment(new Date()).format('ALT'));
console.log(moment(new Date()).format('A'));

setTimeout(() => {
  import('./locale-zh_tw').then(() => {
    console.log(moment(new Date()).format('A'));
  })
}, 200);
```