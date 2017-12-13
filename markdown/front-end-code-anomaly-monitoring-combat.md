[原文地址](https://github.com/happylindz/blog/issues/5)

# 前端代码异常监控实战

## 前言

之前在对公司的前端代码脚本错误进行排查，试图降低 JS Error 的错误量，结合自己之前的经验对这方面内容进行了实践并总结，下面就此谈谈我对前端代码异常监控的一些见解。

本文大致围绕下面几点展开讨论：

1. JS 处理异常的方式
2. 上报方式
3. 异常监控上报常见问题

## JS 异常处理

对于 Javascript 而言，我们面对的仅仅只是异常，异常的出现不会直接导致 JS 引擎崩溃，最多只会使当前执行的任务终止。

1. 当前代码块将作为一个任务压入任务队列中，JS 线程会不断地从任务队列中提取任务执行。
2. 当任务执行过程中出现异常，且异常没有捕获处理，则会一直沿着调用栈一层层向外抛出，最终终止当前任务的执行。
3. JS 线程会继续从任务队列中提取下一个任务继续执行。

```html
<script>
  error
  console.log('永远不会执行');
</script>
<script>
  console.log('我继续执行')
</script>
```

![](/Users/lindongzhou/blog/images/jserror/11.png)

在对脚本错误进行上报之前，我们需要对异常进行处理，程序需要先感知到脚本错误的发生，然后再谈异常上报。

脚本错误一般分为两种：语法错误，运行时错误。

下面就谈谈几种异常监控的处理方式：

### try-catch 异常处理

try-catch 在我们的代码中经常见到，通过给代码块进行 try-catch 进行包装后，当代码块发生出错时 catch 将能捕捉到错误的信息，页面也将可以继续执行。

但是 try-catch 处理异常的能力有限，只能捕获捉到运行时非异步错误，对于语法错误和异步错误就显得无能为力，捕捉不到。

#### 示例：运行时错误

```javascript
try {
  error    // 未定义变量 
} catch(e) {
  console.log('我知道错误了');
  console.log(e);
}
```

![](/Users/lindongzhou/blog/images/jserror/1.png)

然而对于语法错误和异步错误就捕捉不到了。

#### 示例：语法错误

```javascript
try {
  var error = 'error'；   // 大写分号
} catch(e) {
  console.log('我感知不到错误');
  console.log(e);
}
```

![](/Users/lindongzhou/blog/images/jserror/2.png)

一般语法错误在编辑器就会体现出来，常表现的错误信息为： Uncaught SyntaxError: Invalid or unexpected token xxx 这样。但是这种错误会直接抛出异常，常使程序崩溃，一般在编码时候容易观察得到。

#### 示例：异步错误

```javascript
try {
  setTimeout(() => {
    error        // 异步错误
  })
} catch(e) {
  console.log('我感知不到错误');
  console.log(e);
}
```

![](/Users/lindongzhou/blog/images/jserror/3.png)

除非你在 setTimeout 函数中再套上一层 try-catch，否则就无法感知到其错误，但这样代码写起来比较啰嗦。

### window.onerror 异常处理

window.onerror 捕获异常能力比 try-catch 稍微强点，无论是异步还是非异步错误，onerror 都能捕获到运行时错误。

示例：运行时同步错误

```javascript
/**
 * @param {String}  msg    错误信息
 * @param {String}  url    出错文件
 * @param {Number}  row    行号
 * @param {Number}  col    列号
 * @param {Object}  error  错误详细信息
 */
 window.onerror = function (msg, url, row, col, error) {
  console.log('我知道错误了');
  console.log({
    msg,  url,  row, col, error
  })
  return true;
};
error;
```

![](/Users/lindongzhou/blog/images/jserror/4.png)

示例：异步错误

```javascript
window.onerror = function (msg, url, row, col, error) {
  console.log('我知道异步错误了');
  console.log({
    msg,  url,  row, col, error
  })
  return true;
};
setTimeout(() => {
  error;
});
```

![](/Users/lindongzhou/blog/images/jserror/5.png)

然而 window.onerror 对于语法错误还是无能为力，所以我们在写代码的时候要尽可能避免语法错误的，不过一般这样的错误会使得整个页面崩溃，还是比较容易能够察觉到的。

在实际的使用过程中，onerror 主要是来捕获预料之外的错误，而 try-catch 则是用来在可预见情况下监控特定的错误，两者结合使用更加高效。

需要注意的是，window.onerror 函数只有在返回 true 的时候，异常才不会向上抛出，否则即使是知道异常的发生控制台还是会显示 Uncaught Error: xxxxx。

![](/Users/lindongzhou/blog/images/jserror/6.png)

关于 window.onerror 还有两点需要值得注意

1. 对于 onerror 这种全局捕获，最好写在所有 JS 脚本的前面，因为你无法保证你写的代码是否出错，如果写在后面，一旦发生错误的话是不会被 onerror 捕获到的。
2. 另外 onerror 是无法捕获到网络异常的错误。

当我们遇到 ```<img src="./404.png">``` 报 404 网络请求异常的时候，onerror 是无法帮助我们捕获到异常的。

```html
<script>
  window.onerror = function (msg, url, row, col, error) {
    console.log('我知道异步错误了');
    console.log({
      msg,  url,  row, col, error
    })
    return true;
  };
</script>
<img src="./404.png">
```

![](/Users/lindongzhou/blog/images/jserror/7.png)

由于网络请求异常不会事件冒泡，因此必须在捕获阶段将其捕捉到才行，但是这种方式虽然可以捕捉到网络请求的异常，但是无法判断 HTTP 的状态是 404 还是其他比如 500 等等，所以还需要配合服务端日志才进行排查分析才可以。

```html
<script>
window.addEventListener('error', (msg, url, row, col, error) => {
  console.log('我知道 404 错误了');
  console.log(
    msg, url, row, col, error
  );
  return true;
}, true);
</script>
<img src="./404.png" alt="">
```

![](/Users/lindongzhou/blog/images/jserror/8.png)

这点知识还是需要知道，要不然用户访问网站，图片 CDN 无法服务，图片加载不出来而开发人员没有察觉就尴尬了。

### Promise 错误

通过 Promise 可以帮助我们解决异步回调地狱的问题，但是一旦 Promise 实例抛出异常而你没有用 catch 去捕获的话，onerror 或 try-catch 也无能为力，无法捕捉到错误。

```javascript
window.addEventListener('error', (msg, url, row, col, error) => {
  console.log('我感知不到 promise 错误');
  console.log(
    msg, url, row, col, error
  );
}, true);
Promise.reject('promise error');
new Promise((resolve, reject) => {
  reject('promise error');
});
new Promise((resolve) => {
  resolve();
}).then(() => {
  throw 'promise error'
});
```

![](/Users/lindongzhou/blog/images/jserror/9.png)

虽然在写 Promise 实例的时候养成最后写上 catch 函数是个好习惯，但是代码写多了就容易糊涂，忘记写 catch。

所以如果你的应用用到很多的 Promise 实例的话，特别是你在一些基于 promise 的异步库比如 axios 等一定要小心，因为你不知道什么时候这些异步请求会抛出异常而你并没有处理它，所以你最好添加一个 Promise 全局异常捕获事件 unhandledrejection。

```javascript
window.addEventListener("unhandledrejection", function(e){
  e.preventDefault()
  console.log('我知道 promise 的错误了');
  console.log(e.reason);
  return true;
});
Promise.reject('promise error');
new Promise((resolve, reject) => {
  reject('promise error');
});
new Promise((resolve) => {
  resolve();
}).then(() => {
  throw 'promise error'
});
```

![](/Users/lindongzhou/blog/images/jserror/10.png)

当然，如果你的应用没有做 Promise 全局异常处理的话，那很可能就像某乎首页这样：

![](/Users/lindongzhou/blog/images/jserror/14.png)

## 异常上报方式

监控拿到报错信息之后，接下来就需要将捕捉到的错误信息发送到信息收集平台上，常用的发送形式主要有两种:

1. 通过 Ajax 发送数据
2. 动态创建 img 标签的形式

实例 - 动态创建 img 标签进行上报

```javascript
function report(error) {
  var reportUrl = 'http://xxxx/report';
  new Image().src = reportUrl + 'error=' + error;
}
```

## 监控上报常见问题

下述例子我全部放在我的 github 上，读者可以自行查阅，后面不再赘述。

```
git clone https://github.com/happylindz/blog.git
cd blog/code/jserror/
npm install
```

###  Script error 脚本错误是什么

因为我们在线上的版本，经常做静态资源 CDN 化，这就会导致我们常访问的页面跟脚本文件来自不同的域名，这时候如果没有进行额外的配置，就会容易产生 Script error。

![](/Users/lindongzhou/blog/images/jserror/13.png)

可通过 ```npm run nocors``` 查看效果。

Script error 是浏览器在同源策略限制下产生的，浏览器处于对安全性上的考虑，当页面引用非同域名外部脚本文件时中抛出异常的话，此时本页面是没有权利知道这个报错信息的，取而代之的是输出 Script error 这样的信息。

![](/Users/lindongzhou/blog/images/jserror/12.png)

这样做的目的是避免数据泄露到不安全的域中，举个简单的例子，

```javascript
<script src="xxxx.com/login.html"></script>
```

上面我们并没有引入一个 js 文件，而是一个 html，这个 html 是银行的登录页面，如果你已经登录了，那 login 页面就会自动跳转到 ```Welcome xxx...```，如果未登录则跳转到 ```Please Login...```，那么报错也会是 ```Welcome xxx... is not defined，Please Login... is not defined```，通过这些信息可以判断一个用户是否登录他的帐号，给入侵者提供了十分便利的判断渠道，这是相当不安全的。

介绍完背景后，那么我们应该去解决这个问题？

首先可以想到的方案肯定是同源化策略，将 JS 文件内联到 html 或者放到同域下，虽然能简单有效地解决 script error 问题，但是这样无法利用好文件缓存和 CDN 的优势，不推荐使用。正确的方法应该是从根本上解决 script error 的错误。

#### 跨源资源共享机制( CORS )

首先为页面上的 script 标签添加 crossOrigin 属性

```html
// http://localhost:8080/index.html
<script>
  window.onerror = function (msg, url, row, col, error) {
    console.log('我知道错误了，也知道错误信息');
    console.log({
      msg,  url,  row, col, error
    })
    return true;
  };
</script>
<script src="http://localhost:8081/test.js" crossorigin></script>

// http://localhost:8081/test.js
setTimeout(() => {
  console.log(error);
});
```
当你修改完前端代码后，你还需要额外给后端在响应头里加上 ```Access-Control-Allow-Origin: localhost:8080```，这里我以 Koa 为例。

```javascript
const Koa = require('koa');
const path = require('path');
const cors = require('koa-cors');
const app = new Koa();

app.use(cors());
app.use(require('koa-static')(path.resolve(__dirname, './public')));

app.listen(8081, () => {
  console.log('koa app listening at 8081')
});
```

![](/Users/lindongzhou/blog/images/jserror/15.png)

读者可通过 ```npm run cors``` 详细的跨域知识我就不展开了，有兴趣可以看看我之前写的文章：[跨域，你需要知道的全在这里](https://github.com/happylindz/blog/issues/3)

你以为这样就完了吗？并没有，下面就说一些 Script error 你不常遇见的点：

我们都知道 JSONP 是用来跨域获取数据的，并且兼容性良好，在一些应用中仍然会使用到，所以你的项目中可能会用这样的代码：

```javascript
// http://localhost:8080/index.html
window.onerror = function (msg, url, row, col, error) {
  console.log('我知道错误了，但不知道错误信息');
  console.log({
    msg,  url,  row, col, error
  })
  return true;
};
function jsonpCallback(data) {
  console.log(data);
}
const url = 'http://localhost:8081/data?callback=jsonpCallback';
const script = document.createElement('script');
script.src = url;
document.body.appendChild(script);
```

因为返回的信息会当做脚本文件来执行，一旦返回的脚本内容出错了，也是无法捕捉到错误的信息。

![](/Users/lindongzhou/blog/images/jserror/16.png)

解决办法也不难，跟之前一样，在添加动态添加脚本的时候加上 crossOrigin，并且在后端配上相应的 CORS 字段即可.

```javascript
const script = document.createElement('script');
script.crossOrigin = 'anonymous';
script.src = url;
document.body.appendChild(script);
```

读者可以通过 ```npm run jsonp``` 查看效果

![](/Users/lindongzhou/blog/images/jserror/17.png)

知道原理之后你可能会觉得没什么，不就是给每个动态生成的脚本添加 crossOrigin 字段嘛，但是在实际工程中，你可能是面向很多库来编程，比如使用 jQuery，Seajs 或者 webpack 来异步加载脚本，许多库封装了异步加载脚本的能力，以 jQeury 为例你可能是这样来触发异步脚本。

```javascript
$.ajax({
  url: 'http://localhost:8081/data',
  dataType: 'jsonp',
  success: (data) => {
    console.log(data);
  }
})
```

假如这些库中没有提供 crossOrigin 的能力的话(jQuery jsonp 可能有，假装你不知道)，那你只能去修改人家写的源代码了，所以我这里提供一个思路，就是去劫持 document.createElement，从根源上去为每个动态生成的脚本添加 crossOrigin 字段。

```javascript
document.createElement = (function() {
  const fn = document.createElement.bind(document);
  return function(type) {
    const result = fn(type);
    if(type === 'script') {
      result.crossOrigin = 'anonymous';
    }
    return result;
  }
})();
window.onerror = function (msg, url, row, col, error) {
  console.log('我知道错误了，也知道错误信息');
  console.log({
    msg,  url,  row, col, error
  })
  return true;
};
$.ajax({
  url: 'http://localhost:8081/data',
  dataType: 'jsonp',
  success: (data) => {
    console.log(data);
  }
})
```

效果也是一样的，读者可以通过 ```npm run jsonpjq``` 来查看效果：

![](/Users/lindongzhou/blog/images/jserror/18.png)

这样重写 createElement 理论上没什么问题，但是入侵了原本的代码，不保证一定不会出错，在工程上还是需要多尝试下看看再使用，可能存在兼容性上问题，如果你觉得会出现什么问题的话也欢迎留言讨论下。

关于 Script error 的问题就写到这里，如果你理解了上面的内容，基本上绝大部分的 Script error 都能迎刃而解。

### window.onerror 能否捕获 iframe 的错误

当你的页面有使用 iframe 的时候，你需要对你引入的 iframe 做异常监控的处理，否则一旦你引入的 iframe 页面出现了问题，你的主站显示不出来，而你却浑然不知。

首先需要强调，父窗口直接使用 window.onerror 是无法直接捕获，如果你想要捕获 iframe 的异常的话，有分好几种情况。

如果你的 iframe 页面和你的主站是同域名的话，直接给 iframe 添加 onerror 事件即可。

```html
<iframe src="./iframe.html" frameborder="0"></iframe>
<script>
  window.frames[0].onerror = function (msg, url, row, col, error) {
    console.log('我知道 iframe 的错误了，也知道错误信息');
    console.log({
      msg,  url,  row, col, error
    })
    return true;
  };
</script>
```

读者可以通过 ```npm run iframe``` 查看效果：

![](/Users/lindongzhou/blog/images/jserror/19.png)

如果你嵌入的 iframe 页面和你的主站不是同个域名的，但是 iframe 内容不属于第三方，是你可以控制的，那么可以通过与 iframe 通信的方式将异常信息抛给主站接收。与 iframe 通信的方式有很多，常用的如：postMessage，hash 或者 name 字段跨域等等，这里就不展开了，感兴趣的话可以看：[跨域，你需要知道的全在这里](https://github.com/happylindz/blog/issues/3)

如果是非同域且网站不受自己控制的话，除了通过控制台看到详细的错误信息外，没办法捕获，这是出于安全性的考虑，你引入了一个百度首页，人家页面报出的错误凭啥让你去监控呢，这会引出很多安全性的问题。

### 压缩代码如何定位到脚本异常位置




### 收集异常信息量太多，怎么办

如果你的网站访问量很大，假如网页的 PV 有 1kw，那么一个必然的错误发送的信息就有 1kw 条，我们可以给网站设置一个采集率：

```javascript
Reporter.send = function(data) {
  // 只采集 30%
  if(Math.random() < 0.3) {
    send(data)      // 上报错误信息
  }
}
```

这个采集率可以通过具体实际的情况来设定，方法多样化，可以使用一个随机数，也可以具体根据用户的某些特征来进行判定。

上面差不多是我对前端代码监控的一些理解，说起来容易，但是一旦在工程化运用，难免需要考虑到兼容性等种种问题，读者可以通过自己的具体情况进行调整，前端代码异常监控对于我们的网站的稳定性起着至关重要的作用。如若文中所有不对的地方，还望指正。

### 参考链接

* [脚本错误量极致优化-监控上报与Script error](https://github.com/joeyguo/blog/issues/13)
* [前端代码异常日志收集与监控](http://www.cnblogs.com/hustskyking/p/fe-monitor.html)
* [前端魔法堂——异常不仅仅是try/catch](http://www.cnblogs.com/fsjohnhuang/p/7685144.html)