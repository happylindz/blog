# 国际化 - 通用 LTR/RTL 布局解决方案

[原文地址](https://github.com/happylindz/blog/issues/16)

在英文或者中文的网站，我们习惯的阅读方式都是从左往右的，所以你在访问国内外的网站的时候会发现，不管是文字还是布局，都是从左往右进行排版，而我们也熟悉和适应了这种阅读习惯，但是在中东地区，有很多国家，诸如像阿拉伯语、希伯来语，他们的阅读习惯却是从右到左的，恰好跟我们是相反的，我也查阅了大量阿拉伯语的网站的设计，感兴趣也可以点击下面的网站看看：

* [http://wam.ae/ar](http://wam.ae/ar)
* [https://www.emaratalyoum.com/](https://www.emaratalyoum.com/)

通过上面的网站，可以很直观地看出像阿拉伯语，典型 RTL 布局网站的特点：

1. 文字都是右对齐，并且是从右往左阅读的
2. 排版都是从右到左的，在一个产品列表中，右边第一个商品是第一个
3. 箭头代表的意义刚好相反，比如在轮播图中，向左箭头代表下一帧，而向右箭头则代表查看上一张图片

知道了 RTL 布局的特点，我们在使用场景上需要考虑：

1. 如何以较低的成本，可维护，兼容地改造线上已有的场景支持 RTL 布局网站
2. 对于未来新的场景，怎么样在编码的环节可以快速支持 LTR、RTL 布局特点的网站

所以本文探究的是**在假定语言文案，图片等信息正确的情况下，如何使用一套代码，不仅可以支持像英文，中文等 LTR 布局的网站，也可以支持像阿拉伯，希伯来语等 RTL 布局的网站。**

## "神奇" 的 direction

在做 RTL 布局的时候，我们自然而然就会想到 direction 这个 CSS 属性，它与在 html 标签上直接添加 ```dir="rtl"``` 的作用一样，可以改变我们网站的布局特点，CSS 手册中对 direction 属性是这样描述的：**该属性指定了块的基本书写方向，以及针对 Unicode 双向算法的嵌入和覆盖方向。**

讲的很绕口，看的云里雾里的，通俗点讲，它改变了部分元素的书写特点：

1. 定义过 ```direction:rtl``` 的元素，如果没有预先定义过 text-align，那么这个元素的 text-align 的值就变成了 right，如果设置了 left/center 则无效
2. 对于数字和标点符号以外的编码，顺序仍然是从左到右的
3. 改变了 inline-block 元素的书写顺序

通过下面几个简单例子就可以理解：

```html
<style>
    span {
        display: inline-block;
    }
</style>
<div style="direction: rtl;">1 2 3 4 5 6</div>
<div style="text-align:left;">1 2 3 4 5 6</div>
<div style="text-align:right;">1 2 3 4 5 6</div>
<div style="direction: rtl;"><span>This is </span><span>my blog</span></div>
<div style="direction: rtl;">这是我的博客。</div>
<div style="text-align:right;">这是我的博客。</div>
<div style="direction: rtl;">هذا هو بلدي بلوق.</div>
<div style="text-align:right;">هذا هو بلدي بلوق.</div>
```
展示效果：

![](https://img.alicdn.com/tfs/TB1G.MzlkvoK1RjSZFNXXcxMVXa-800-378.png)

## direction 真的是万能的吗？

上面介绍了一些 direction 的基本用法，那是不是就可以认为只要使用 ```direction: rtl``` 之后网站就可以做到兼容阿拉伯语/希伯来语等排版从右往左的网站了呢？答案是否定的。 direction 的功能并没有你想象中那么强大。

在 PC 网页上，页面布局是千变万化的，比如我们常使用的布局有：flex，内联，浮动，绝对定位等布局方式。

我也对一些常用的布局方式进行测试：

(1) flex 布局：
<iframe width="100%" height="300" src="//jsfiddle.net/0srfqgnp/1/embedded/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

(2) inline-block 布局：

<iframe width="100%" height="300" src="//jsfiddle.net/t7kn9dap/embedded/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

(3) float 布局:
<iframe width="100%" height="300" src="//jsfiddle.net/y0tdv7hn/embedded/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

(4) 绝对定位布局：
<iframe width="100%" height="300" src="//jsfiddle.net/yopreL9z/embedded/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

通过上述的测试可以发现 direction 只能改变 display: flex/inline-block 元素的书写方向，对于 float/绝对定位布局就无能为力，更别谈复杂的页面布局，比如 BFC 布局、双飞翼、圣杯布局等等。

另外 direction 无法改变 margin, padding, border 的水平方向，也就是说除非你的元素是居中的，否则当你的元素是不对称的话，即使你改变了元素的书写方向和顺序，margin-left 还是指向左边的，它并不会留出右边的空白。从下面的图对比就可以看出：在左右间距不对称的时候，直接使用 direction 会对我们本来设计的布局产生效果上的偏差。

![LTR 布局效果](https://img.alicdn.com/tfs/TB1iz9slmzqK1RjSZFHXXb3CpXa-2518-824.jpg)
![RTL 布局效果](https://img.alicdn.com/tfs/TB1RNWolb2pK1RjSZFsXXaNlXXa-2526-808.jpg)

## 基于 direction 通用布局方案设计

在知道了 direction 的特点和不足之后，那么如何围绕 direction 打造一套通用的布局方案呢？

从上面的分析，对于布局/间距翻转能力的缺失，我们可以对 CSS 进行后处理来达到我们需要的效果，举个例子，可以在 Github 上搜 [rtlcss](https://rtlcss.com/learn/usage-guide/string-map/) 这个模块，它的原理就是对 CSS 文件进行处理，比如将 CSS 属性中的 left 改为 right，right 改为 left。

通过这种能力，无论是 float/绝对定位布局，还是 margin/padding 间距，都可以很好地改变书写方向。举个简单例子：

```css
.test {
    direction: ltr;
    float: left;
    position: relative;
    left: 20px;
    margin-left: 100px;
    padding-right: 30px;
}
```

通过 rtlcss 模块处理后的 CSS 将变成：

```css
.test {
    direction: rtl;
    float: right;
    position: relative;
    right: 20px;
    margin-right: 100px;
    padding-left: 30px;
}
```

通过这样的处理，大部分场景下的布局都可以都可以得到很好的处理，比如简单对比像绝对定位这样的布局：

![LTR 绝对定位布局](https://img.alicdn.com/tfs/TB1wOaxlbPpK1RjSZFFXXa5PpXa-3108-870.png)

经过 rtlcss 处理后的页面效果：

![RTL 绝对定位布局](https://img.alicdn.com/tfs/TB1Y9KplmrqK1RjSZK9XXXyypXa-3090-880.png)

**上面是基于 direction 布局方案原理，当然它也有一些能力上的不足和值得去思考的地方：**

**首先这是针对 CSS 的，也就是页面的初始化展示效果，但是涉及到 JS 就无能为力了**，比如在轮播图中，通过 JS 去控制图片的下一帧，在不同的 LTR、RTL 布局中就产生额外的兼容代码。

**其次，它无法处理 html 中内嵌在标签中的样式**，比如我们在写 React 组件中可以能会写出这样的代码:

```javascript
function SomeComponent({ isSomething }) {
    return <div style={{ marginLeft: isSomething ? 20 : 10 }} ></div>;
}
```

像这样书写的方式以后就要改成基于 class 切换：

```javascript
function SomeComponent({ isSomething }) {
    const cls = classNames({
        marginLeft20: isSometing,
        marginLeft10: !isSometing
    })
    return <div className={cls}></div>;
}
```

这部分内容可以通过规范去避免写内联样式，也可以通过正则去修改替换修改样式。

**第三点需要考虑的是图标库**，上面的问题解决了布局，文字排版的问题，但是对于图标来说仅仅只是布局上的移动，根据 Google 的 [Material Design在双向性一章](https://www.mdui.org/design/usability/bidirectionality.html#bidirectionality-rtl-mirroring-guidelines) 的内容可以看出，有些图标是需要翻转的，有些图标不用，再比如左右箭头，在不同布局中的意义也是不一样的，所以针对 RTL 的布局，我们需要重新设计一套字体库用于 RTL 布局，真正给使用诸如像阿拉伯语、希伯来语的用户带来本地化的体验。

第四点是需要有更加细粒度的控制，因为在 RTL 布局中，不是所有的内容都一定是从右到左进行排版的，**我们需要在整体 RTL 的页面中忽视掉某些模块，使其仍然是以从左往右顺序的能力。**

这部分怎么做呢？可以给不需要翻转的模块的 CSS 文件中添加像 ```/* rtl:ignore */```，然后让像 rtlcss 在处理的时候可以忽略掉对该模块的处理，从而让该模块在 RTL 布局中保持已有的展示效果。

在真正实现的过程中，肯定还会遇到其它更多的问题，比如像：CSS 的命名规则(直接加 -rtl 或其它来保证非覆盖发布)，还是说如何进行 CDN 部署发布等等一系列的工程实践问题，相信在不久的将来，经过实践上线后会产出基于 direction 通用布局的最佳工程实践方案。

## "神奇" 的 transform 镜像翻转

上面介绍完基于 direction 的布局方案，最后通过一套代码编译成一套 html，多套 css，一套 js 文件，区分国家用户来进行访问。那么有没有可能通过一套代码，生成一套 html，css，js 文件供用户去访问呢？请听下文分解。

想必前端工程师都使用过 CSS3 的 transform 属性，通过 ```transform: scaleX(-1)``` 可以使页面沿着中轴进行水平翻转(关于 ```transform scaleX/rotateY``` 水平翻转用法可以看 [CSS垂直翻转/水平翻转提高web页面资源重用性
](https://www.zhangxinxu.com/wordpress/2011/05/css%E5%AE%9E%E7%8E%B0%E5%90%84%E4%B8%AA%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E7%9A%84%E5%9E%82%E7%9B%B4%E7%BF%BB%E8%BD%AC%E6%B0%B4%E5%B9%B3%E7%BF%BB%E8%BD%AC%E6%95%88%E6%9E%9C/)

通过水平翻转，原本 LTR 的布局页面：

![LTR 布局页面](https://img.alicdn.com/tfs/TB1Dq9LlXYqK1RjSZLeXXbXppXa-3150-1510.png)

经过水平翻转之后就变成 RTL 布局页面：

![RTL 布局页面](https://img.alicdn.com/tfs/TB1o8yRlhTpK1RjSZFMXXbG_VXa-3168-1436.png)

并且这种方式在布局上具有良好的兼容性，跟 direction 改变方向不同，**你根本无需考虑你的布局：flex/浮动/绝对定位等等，都可以很好地从 LTR 布局变成 RTL 布局。**

解决了布局问题，但是也引入的新的问题，就是文字，图片等等信息全部都翻转了，所以我们在文字部分需要将文字再翻转回来，比如说在文字的容器上加上 ```transform: scaleX(-1)```，这样就可以保持内容的正确书写顺序。

基于这样的思路，一种通过 transform 镜像翻转来实现 RTL 布局的方案设计就应运而生。

## 基于 transform 镜像翻转通用布局方案设计

通过 transform 的镜像翻转，可以很好地解决了布局翻转的问题，基于 transform 设计通用布局我的思路是这样的：

首先编写一个 npm 模块，它是一个 React 组件，使用它的时候需要引入它的 CSS 文件和 JS 组件。

如果页面需要支持，在阿拉伯语页面上添加上全局翻转：

```css
// xxxxx/index.css
html[lang="ar"] {
    transform: scaleX(-1);
}
```

接下来只需要考虑页面上不需要翻转的内容，比如：文字，部分图片，一些图标等等元素。

对于这些元素，可以通过 React 组件进行包裹，用法如下：

```javascript
import{ NoFlipOver } from 'xxxxx';

function SomeComp({ title, imgUrl }) {
    const comp1 = <NoFlipOver>
        { title }
    </NoFlipOver>;
    const comp2 = <NoFlipOver>
        <Icon type="clock" />
    </NoFlipOver>;
    const comp3 = <NoFlipOver>
        <img src={ imgUrl } />
    </NoFlipOver>;
    const comp4 = <NoFlipOver>
        <SomethingYouDontKnow />
    </NoFlipOver>;
}
```

通过这种轻量级的入侵代码，开发者无需关心具体的翻转逻辑，只需要将页面中不需要翻转的内容进行包裹即可。而我们需要做的是如何编写一个通用的不翻转 React 组件，举个例子，如果接受到的内容是一段文字，就可以像这样进行处理:

```javascript
// xxxxx/index.js
const NoFlipOver = function({ children, ...props }) {
    if(typeof children === 'string') {
        return <span { ...props } className="no-flip-over">{ children }</span>;
    }
}
```
```css
// xxxxx/index.css
html[lang="ar"] .no-flip-over {
    transform: scaleX(-1);
}
```

对文字的处理比较简单，只需要通过 span 标签进行包裹（保证文字向右对齐，如果原本是左对齐的话）这样简单的文字处理组件就完成，当然这里只是举一个简单的例子，在设计通用布局 React 容器组件的时候肯定需要考虑到各个方面，这里需要等我具体实践之后才能产出更多的经验。

基于这样的思路，可以很好，**更加细粒度地去控制页面模块的展示形态，需要翻转的内容，无需处理，不需要的翻转的内容，需要用一个 React 容器组件进行包裹，从而达到页面自适应 LTR/RTL 布局效果。**

前面介绍了基于 direction/transform 镜像翻转来实现通用布局方案，下面我就对比来谈谈 transform 镜像翻转方案相对于 direction 方案具有哪些优势呢？

首先它不只是针对 CSS 展示效果，因为是将整个页面沿中轴进行翻转，margin-left 在浏览器理解上是属于向右的，所以 **transform 方案是兼容 JS 逻辑的，也就是说无需修改 JS 逻辑，而 direction 方案只是针对 CSS，JS 逻辑需要调整兼容。**

**第二点，它可以直接使用一套图标库，一套图片即可，需要翻转的无需处理，不需翻转的就使用 NoFlipOver 进行包裹。**比如说像下面这样一个图文分离的 banner:

![LTR 布局](https://img.alicdn.com/tfs/TB1_j7tlgHqK1RjSZFEXXcGMXXa-3128-384.png)

经过镜像翻转之后，就变成了：

![RTL 布局](https://img.alicdn.com/tfs/TB1eDcslkzoK1RjSZFlXXai4VXa-2804-296.png)

如果是通过 direction 方案的话就需要准备两张图片了（当然如果是图文不分离的话也是需要老老实实准备两套图片）

**第三点，它不需要考虑 CSS 命名，CDN 部署等一系列工程问题**，因为它是划分 CSS 作用域的方式，针对 LTR/RTL 布局进行隔离适配。 

**第四点，内嵌样式 transform 方案也可以很好地做到兼容，而 direction 方案是针对 CSS 文件的，如果要针对 html 文件则需要另外额外的工作。**

说了一些 transform 方案对比与 direction 方案的优势，下面就讲讲其缺点：

第一，**它需要对我们已有的业务场景进行改造，入侵业务代码**，也就是说，如果你的场景相对比较分散，公用模块复用率较低，那么在使用 transform 方案的时候就需要对每个场景单独进行修改适配，当然如果你的场景公用组件多，对公共模块修改可以很好在各个场景中复用，这样一次性的成本就相对比较容易。

第二点，对于一些页面滚动组件需要做额外的兼容操作，经过我的实践发现，滚动组件在经过翻转之后存在着一些问题，初步认为是因为翻转之后带来一些高度属性值的变化，具体原因需要等兼容适配时候才清楚。

## 总结

本文通过对 direction/transform 属性使用和剖析，设计了两款不同思路的 LTR/RTL 通用布局方案，两套方案各有千秋，有优势，也有自身不足的地方。

在动手准备改造之前，最好先跟 UED 确认好 RTL 布局的设计规范，避免因为主观认知导致错误的视觉偏差，这样可以给中东地区的用户提供更加本地化的体验，这里也有关于页面布局双向性的设计规范，感兴趣的可以看一看：[MATERIAL DESIGN - Bidirectionality](https://material.io/design/usability/bidirectionality.html)

最后针对不同的业务场景选择，运用合适的通用布局方案，才能有效地降低开发和维护成本。

