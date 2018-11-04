# 使用 Proload/Prefetch 优化你的应用

[原文地址](https://github.com/happylindz/blog/issues/17)

衡量网站的性能的指标有很多，其中有项重要的指标就是网站的首屏时间，为此前端工程师们都是绞尽脑汁想尽办法进行优化自己的应用，诸如像服务端渲染，懒加载，CDN 加速，ServiceWorker 等等方法，今天介绍的 preload/prefetch 是一种简单，但却事半功倍的优化手段。

## 基本用法

在网络请求中，我们在使用到某些资源比如：图片，JS，CSS 等等，在执行之前总需要等待资源的下载，如果我们能做到预先加载资源，那在资源执行的时候就不必等待网络的开销，这时候就轮到 preload 大显身手的时候了。

### preload 提前加载

preload 顾名思义就是一种预加载的方式，它通过声明向浏览器声明一个需要提交加载的资源，当资源真正被使用的时候立即执行，就无需等待网络的消耗。

它可以通过 Link 标签进行创建：

```html
<!-- 使用 link 标签静态标记需要预加载的资源 -->
<link rel="preload" href="/path/to/style.css" as="style">

<!-- 或使用脚本动态创建一个 link 标签后插入到 head 头部 -->
<script>
const link = document.createElement('link');
link.rel = 'preload';
link.as = 'style';
link.href = '/path/to/style.css';
document.head.appendChild(link);
</script>
```

当浏览器解析到这行代码就会去加载 href 中对应的资源但不执行，待到真正使用到的时候再执行，另一种方式方式就是在 HTTP 响应头中加上 preload 字段：

```
Link: <https://example.com/other/styles.css>; rel=preload; as=style
```

这种方式比通过 Link 方式加载资源方式更快，请求在返回还没到解析页面的时候就已经开始预加载资源了。

讲完 preload 的用法再来看下它的浏览器兼容性，根据 caniuse.com 上的介绍：IE 和 Firefox 都是不支持的，兼容性覆盖面达到 73%。

![](https://img.alicdn.com/tfs/TB1t1Bxna6qK1RjSZFmXXX0PFXa-2630-882.png)

### prefetch 预判加载

prefetch 跟 preload 不同，它的作用是告诉浏览器未来可能会使用到的某个资源，浏览器就会在闲时去加载对应的资源，若能预测到用户的行为，比如懒加载，点击到其它页面等则相当于提前预加载了需要的资源。它的用法跟 preload 是一样的：

```html
<!-- link 模式 -->
<link rel="prefetch" href="/path/to/style.css" as="style">

<!-- HTTP 响应头模式 -->
Link: <https://example.com/other/styles.css>; rel=prefetch; as=style
```

讲完用法再讲浏览器兼容性，prefetch 比 preload 的兼容性更好，覆盖面可以达到将近 80%。

![](https://img.alicdn.com/tfs/TB1EydDnkvoK1RjSZFDXXXY3pXa-2538-902.png)

## 更多细节点

当一个资源被 preload 或者 prefetch 获取后，它将被放在内存缓存中等待被使用，如果资源位存在有效的缓存极致（如 cache-control 或 max-age），它将被存储在 HTTP 缓存中可以被不同页面所使用。

正确使用 preload/prefetch 不会造成二次下载，也就说：**当页面上使用到这个资源时候 preload 资源还没下载完，这时候不会造成二次下载，会等待第一次下载并执行脚本**。

**对于 preload 来说，一旦页面关闭了，它就会立即停止 preload 获取资源，而对于 prefetch 资源，即使页面关闭，prefetch 发起的请求仍会进行不会中断。**

### 什么情况会导致二次获取？

1. 不要将 preload 和 prefetch 进行混用，它们分别适用于不同的场景，对于同一个资源同时使用 preload 和 prefetch 会造成二次的下载。
2. preload 字体不带 crossorigin 也将会二次获取！ 确保你对 preload 的字体添加 crossorigin 属性，否则他会被下载两次，这个请求使用匿名的跨域模式。这个建议也适用于字体文件在相同域名下，也适用于其他域名的获取(比如说默认的异步获取)。

preload 是告诉浏览器页面必定需要的资源，浏览器一定会加载这些资源，而 prefetch 是告诉浏览器页面可能需要的资源，浏览器不一定会加载这些资源。所以建议：对于当前页面很有必要的资源使用 preload，对于可能在将来的页面中使用的资源使用 prefetch。

### 这将会浪费用户的带宽吗？

用 “preload” 和 “prefetch” 情况下，如果资源不能被缓存，那么都有可能浪费一部分带宽，在移动端请慎用。

没有用到的 preload 资源在 Chrome 的 console 里会在 onload 事件 3s 后发生警告。

![](https://img.alicdn.com/tfs/TB1I8OAnkvoK1RjSZFwXXciCFXa-1000-285.png)

原因是你可能为了改善性能使用 preload 来缓存一定的资源，但是如果没有用到，你就做了无用功。在手机上，这相当于浪费了用户的流量，所以明确你要 preload 对象。

### 如何检测 preload 支持情况？

用下面的代码段可以检测 ```<link rel=”preload”>``` 是否被支持：

```javascript
const preloadSupported = () => {
    const link = document.createElement('link');
    const relList = link.relList;
    if (!relList || !relList.supports)
        return false;
    return relList.supports('preload');
};
```

## 不同资源浏览器优先级

在 Chrome 46 以后的版本中，不同的资源在浏览器渲染的不同阶段进行加载的优先级如下图所示：

![](https://img.alicdn.com/tfs/TB1LtWwnirpK1RjSZFhXXXSdXXa-1000-1040.png)

一个资源的加载的优先级被分为五个级别，分别是：

* Highest 最高
* High 高
* Medium 中等
* Low 低
* Lowest 最低

从图中可以看出：(以 Blink 为例)

1. HTML/CSS 资源，其优先级是最高的
2. font 字体资源，优先级分别为 Highest/High
3. 图片资源，如果出现在视口中，则优先级为 High，否则为 Low

而 script 脚本资源就比较特殊，优先级不一，脚本根据它们在文件中的位置是否异步、延迟或阻塞获得不同的优先级：

* 网络在第一个图片资源之前阻塞的脚本在网络优先级中是 High
* 网络在第一个图片资源之后阻塞的脚本在网络优先级中是 Medium
* 异步/延迟/插入的脚本（无论在什么位置）在网络优先级中是 Low

自己网站资源优先级也可以通过 Chrome 控制台 Network 一栏进行查看.

1. 对于使用 prefetch 获取资源，其优先级默认为最低，Lowest，可以认为当浏览器空闲的时候才会去获取的资源。
2. 而对于 preload 获取资源，可以通过 "as" 或者 "type" 属性来标识他们请求资源的优先级（比如说 preload 使用 as="style" 属性将获得最高的优先级，即使资源不是样式文件)
3. 没有 “as” 属性的将被看作异步请求。

## 与其它加载方式对比

### async/defer：

![](https://img.alicdn.com/tfs/TB1WCV.nXzqK1RjSZSgXXcpAVXa-689-112.png)

使用 async/defer 属性在加载脚本的时候不阻塞 HTML 的解析，defer 加载脚本执行会在所有元素解析完成，DOMContentLoaded 事件触发之前完成执行。它的用途其实跟 preload 十分相似。你可以使用 defer 加载脚本在 head 末尾，这比将脚本放在 body 底部效果来的更好。

1. 它相比于 preload 加载的优势在于浏览器兼容性好，从 caniuse 上看基本上所有浏览器都支持，覆盖率达到 93%，
2. 不足之处在于：defer 只作用于脚本文件，对于样式、图片等资源就无能为力了，并且 defer 加载的资源是要执行的，而 preload 只下载资源并不执行，待真正使用到才会执行文件。
3. 对于页面上主/首屏脚本，可以直接使用 defer 加载，而对于非首屏脚本/其它资源，可以采用 preload/prefeth 来进行加载。

### HTTP/2 Server Push

**HTTP/2 PUSH 功能可以让服务器在没有相应的请求情况下预先将资源推送到客户端。这个跟 preload/prefetch 预加载资源的思路类似，将下载和资源实际执行分离的方法**，当脚本真正想要请求文件的时候，发现脚本就存在缓存中，就不需要去请求网络了。

我们假设浏览器正在加载一个页面，页面中有个 CSS 文件，CSS 文件又引用一个字体库，对于这样的场景，

若使用 HTTP/2 PUSH，当服务端获取到 HTML 文件后，知道以后客户端会需要字体文件，它就立即主动地推送这个文件给客户端，如下图：

![](https://img.alicdn.com/tfs/TB10PeanXYqK1RjSZLeXXbXppXa-591-413.png)

而对于 preload，服务端就不会主动地推送字体文件，在浏览器获取到页面之后发现 preload 字体才会去获取，如下图：

![](https://img.alicdn.com/tfs/TB1GuecnmzqK1RjSZFLXXcn2XXa-591-413.png)

对于 Server Push 来说，如果服务端渲染 HTML 时间过长的话则很有效，因为这时候浏览器除了干等着，做不了其它操作，但是不好的地方是服务器需要支持 HTTP/2 协议并且服务端压力也会相应增大。对于更多 Server Push 和 preload 的对比可以参考这篇文章：[HTTP/2 PUSH(推送)与HTTP Preload(预加载)大比拼](https://www.zcfy.cc/article/http-2-push-vs-http-preload-dexecure-4722.html?t=new)

### 浏览器预解析

现代浏览器很聪明，就如 Chrome 浏览器，它会在解析 HTML 时收集外链，并在后台并行下载，它也实现了提前加载以及加载和执行分离。

![](https://img.alicdn.com/tfs/TB1fTygnXzqK1RjSZSgXXcpAVXa-997-324.png)

它相比于 preload 方式而言：

* 仅限于 HTML 解析，对于 JS 异步加载资源的逻辑就无无能为力了
* 浏览器不暴露 preload 中的 onload 事件，也就无法更加细粒度地控制资源的加载

## 使用案例

1. 提前加载字体文件。由于字体文件必须等到 CSSOM 构建完成并且作用到页面元素了才会开始加载，会导致页面字体样式闪动。所以要用 preload 显式告诉浏览器提前加载。假如字体文件在 CSS 生效之前下载完成，则可以完全消灭页面闪动效果。
2. 使用 preload 预加载第二屏的内容，在网页开发中，对于非首屏部分采用懒加载是我们页面常用的优化手段，所以我们在页面 onload 之后可以通过 preload 来加载次屏所需要的资源，在用户浏览完首屏内容滚动时能够更快地看到次屏的内容。
3. 在页面加载完成之后，可以分析页面上所有的链接，判断用户可能会点击的页面，分析提取下一跳页面上所有的资源使用 prefetch 进行加载(这里不使用 preload，因为不一定会点击)，浏览器会在空闲地时候进行加载，当用户点击链接命中了缓存，这可以有效地提升下一页面的首屏渲染时间。
4. 对于商品列表页面，在用户鼠标停留在某个商品的时候，可以去分析商品详情页所需要的资源并提前开启 preload 加载，跟第 3 点类似，都是用来预测用户的行为并且做出一些预加载的手段，区别在于当用户停留在商品上时，点击命中率更高，preload 可以立即加载资源，有效提升缓存命中率。

## 总结

preload/prefetch 是个好东西，能让浏览器提前加载需要的资源，将资源的下载和执行分离开来，运用得当的话可以对首屏渲染带来不小的提升，可以对页面交互上带来极致的体验。

## 参考链接

* [有一种优化，叫Preload](https://mp.weixin.qq.com/s?__biz=MzUxMTcwOTM4Mg==&mid=2247484163&idx=1&sn=16b9c907971683dd61cee251adcde79b&chksm=f96edaaace1953bcaf65a1adcf30b6d3dd66cf7b648ae59c4bf807d3f8bf460d5cd638e54ca1&token=946370022&lang=zh_CN#rd)
* [Preload，Prefetch 和它们在 Chrome 之中的优先级](https://github.com/xitu/gold-miner/blob/master/TODO/preload-prefetch-and-priorities-in-chrome.md)
* [用 preload 预加载页面资源](https://juejin.im/post/5a7fb09bf265da4e8e785c38#heading-8)
* [HTTP/2 PUSH(推送)与HTTP Preload(预加载)大比拼](https://www.zcfy.cc/article/http-2-push-vs-http-preload-dexecure-4722.html?t=new)
