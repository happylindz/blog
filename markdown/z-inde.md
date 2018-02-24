[原文地址](https://github.com/happylindz/blog/issues/11)

# 深入理解 CSS 属性 z-index 

## 前言

最近在使用 CSS3 动画的时候遇到一个 DOM 层叠的问题，故此重新学习了一下 z-index，感觉这个 CSS 属性还是挺复杂的，希望本文可以帮助你重新认识 z-index 的魅力。

事情的经过是这样的(背景有点长)，最近在写下面这样的列表页：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/1.jpg)

然后给每个产品项添加一个 CSS3 动画，动画效果大概像这样: [Demo 地址](https://codepen.io/jasonheecs/pen/GNNwpZ)

实现后的效果大概是这样的(截图有点糊，建议点 Demo 地址查看)：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/2.gif)

在 Chrome 上显示正常，但是从 Safari 打开，就发现不得了了，动画十分卡顿：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/3.gif)

在切换不同的产品项的时候会发现页面动画明显卡顿，想到这，其实这难不倒我，于是我就给每个产品项添加 3D 动画硬件加速，方法也十分简单，就像下面这样。

```css
.item {
  transform: translateZ(0);      /* 或者 will-change: transform; */
}
```

这是一种常见的硬件加速的优化方式， 如果不懂的话可以看这个：[用CSS开启硬件加速来提高网站性能](https://www.cnblogs.com/rubylouvre/p/3471490.html)

之后打开 Safari 后发现页面动画十分流畅，硬件加速的优化成功，但是随之而来又出现新的问题，也就是本文所说的 DOM 元素层叠问题。

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/4.jpg)

虽然动画效果卡顿修复了，但是页面 DOM 元素层叠却出现问题：也就是下面的产品项会覆盖上面产品项右下角的入口弹框，而我们希望的正常的效果应该是这样：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/5.jpg)

遇到这样的问题，第一反应：那我将弹框的 z-index 调大不就好了，小菜一碟，但是无论我怎么调整 z-index 的值，弹框始终被下方的产品项所覆盖，一开始我也百思不得其解。

最后通过看了一些资料学习梳理，最终找到解决的办法，废话不多说，下面我就开始梳理整个 z-index 相关知识，并在最后提交上述问题的解决方案。(**下文讲解会附带很多的用例，我将代码全部贴在 jsfiddle 方便查阅，读者可以点击 demo 地址查看例子**)

## z-index 基础

首先介绍一下 z-index，z-index 属性是用来调整元素及子元素在 z 轴上的顺序，当元素发生覆盖的时候，那个元素在上面，那个元素在下面。通常来说，z-index 值较大的元素会覆盖较低的元素。

z-index 的默认值为 auto，可以设置正整数，也可以设置为负整数，如果不考虑 CSS3，只有定位元素(position:relative/absolute/fixed)的 z-index 才有作用，如果你的 z-index 作用于一个非定位元素(一些 CSS3 也会生效)，是不起任何作用的。比如: [demo 地址](https://jsfiddle.net/z945msu2/1/)

当你为 DOM 元素设置了定位后，该元素的 z-index 就会生效，默认为 auto，你可以简单将它等同于 z-index: 0，比如：[demo 地址](https://jsfiddle.net/f8uwtu13/)，**也就是说，z-index 生效的前提条件是必须要设置定位属性(或者一些 CSS3 属性)，才能够生效**

看完 demo 你可能会觉得纳闷，为啥我单单只设置了一个 position 属性，没设置 z-index 值，为啥红色方格会覆盖蓝色方格，这里就涉及到了 z-index 层叠水平的知识。

## 层叠水平(stacking level)

一个 DOM 元素，在不考虑层叠上下文的情况下，会按照层叠水平决定元素在 z 轴上的显示顺序，**通俗易懂地讲，不同的 DOM 元素组合在一起发生重叠的时候，它们的的显示顺序会遵循层叠水平的规则，而 z-index 是用来调整某个元素显示顺序，使该元素能够上浮下沉。**

那么层叠水平是什么样的呢？下面就是著名的 7 阶层叠水平(stacking level)

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/6.jpg)

可以看出，层叠水平规范了元素重叠时候的呈现规则，有了这个规则，我们也就不难解释为何之前例子中红色方格会覆盖蓝色方格。**因为当你设置了 position: relative 属性后，元素 z-index:auto 生效导致层叠水平提升，比普通内联元素来的高，所以红色方格会显示在上方。**

知道了层叠水平的规则后，下面我就举几个例子来说明：

### inline/inline-block 元素高于浮动元素

首先是 inline/inline-block 元素高于浮动元素，[demo 地址](https://jsfiddle.net/moLe6haq/2/)

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/7.jpg)

可以很清晰的看出文字(inline元素)覆盖了图片(浮动元素).

### inline/inline-block 元素高于 block 元素

[demo 地址](https://jsfiddle.net/e01bc47b/4/)

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/8.jpg)

红色方格(inline-block)覆盖绿色方格(block)，但是由于文字(display:block)属于 inline 水平，与红色方格(inline-block) 同级，遵循后来居上(接下来会解释)原则，没有被 inline-block 元素覆盖。

### 元素层叠水平相当

那么当两个元素层叠水平相同的时候，这时候就要遵循下面两个准则：

1. 后来居上原则
2. 谁 z-index 大，谁在上的准则

#### 后来居上的原则

后来居上准则就是说，当元素层叠水平相同的时候后面的 DOM 会覆盖前面的 DOM 元素。这个很好理解，不过多解释了。这也就是我们经常会看到为什么后面的元素会覆盖前面的元素。**正如前面看到的那个例子，由于文字(display:block)属于 inline 水平，与红色方格(inline-block) 同级，遵循后来居上(接下来会解释)原则，没有被 inline-block 元素覆盖。**这里我就不另外贴例子来说明了。

#### 谁 z-index 大，谁在上

因为 z-index 的存在，导致元素在相同的层叠上下文中的顺序是可以调整的，那么在 z-index 负值和正值的范围内，在这两个区间内的话 DOM 元素的 z-index 值越大，显示顺序就会越靠前。

知道了层叠水平之后，基本上只要元素在同一个层叠上下文中的显示顺序就确定了，但是如果是在不同的层叠上下文中呢，又是如何显示的呢？这个层叠上下文又是什么意思？别急，接着往下看。

## 层叠上下文

层叠上下文，你可以理解为 JS 中的作用域，一个页面中往往不仅仅只有一个层叠上下文(因为有很多种方式可以生成层叠上下文，只是你没有意识到而已)，在一个层叠上下文内，我们按照层叠水平的规则来堆叠元素。

介绍完层叠上下文的概念，我们先来看看哪些方式可以创建层叠上下文？

正常情况下，一共有三种大的类型创建层叠上下文：

1. 默认创建层叠上下文
2. 需要配合 z-index 触发创建层叠上下文
3. 不需要配合 z-index 触发创建层叠上下文

### 默认创建层叠上下文

默认创建层叠上下文，只有 HTML 根元素，这里你可以理解为 body 标签。它属于根层叠上下文元素，不需要任何 CSS 属性来触发。

### 需要配合 z-index 触发创建层叠上下文

依赖 z-index 值创建层叠上下文的情况：

1. position 值为 relative/absolute/fixed(部分浏览器)
2. flex 项(父元素 display 为 flex|inline-flex)，注意是子元素，不是父元素创建层叠上下文

这两种情况下，需要设置具体的 z-index 值，不能设置 z-index 为 auto，这也就是 z-index: auto 和 z-index: 0 的一点细微差别。

前面我们提到，设置 position: relative 的时候 z-index 的值为 auto 会生效，但是这时候并没有创建层叠上下文，当设置 z-index 不为 auto，哪怕设置 z-index: 0 也会触发元素创建层叠上下文。

### 不需要配合 z-index 触发创建层叠上下文

这种情况下，基本上都是由 CSS3 中新增的属性来触发的，常见的有：

1. 元素的透明度 opacity 小于1
2. 元素的 mix-blend-mode 值不是 normal
3. 元素的以下属性的值不是 none：
  * transform
  * filter
  * perspective
  * clip-path
  * mask / mask-image / mask-border
4. 元素的 isolution 属性值为 isolate
5. 元素的 -webkit-overflow-scrolling 属性为 touch
6. 元素的 will-change 属性具备会创建层叠上下文的值

介绍完如何创建层叠上下文概念以及创建方式后，需要说明的是，创建了层叠上下文的元素可以理解局部层叠上下文，它只影响其子孙代元素，它自身的层叠水平是由它的父层叠上下文所决定的。

## 比较两个 DOM 元素显示顺序

接下来就来总结一下如何比较两个 DOM 元素的显示顺序呢？

1. 如果是在相同的层叠上下文，按照层叠水平的规则来显示元素
2. **如果是在不同的层叠上下文中，先找到共同的祖先层叠上下文，然后比较共同层叠上下文下这个两个元素所在的局部层叠上下文的层叠水平，**

千言万语浓缩于这两句话中，但是里面注意的点有很多，我们先来看第一点：

### 共同层叠上下文

如果是在相同的层叠上下文，按照层叠水平的规则来显示元素，这个之前在介绍层叠水平的时候就已经介绍了，值得注意的是，父子关系的元素很可能在相同的层叠上下文，这种情况下元素的层级比较也是按照层叠水平的规则来显示。

举个例子：[demo 地址](https://jsfiddle.net/lindz/3uan3vjv/4/)

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/9.jpg)

.box 元素和其子元素 img 的比较：**因为 img 和 .box 属于相同的层叠上下文中，因为 img z-index 为 -1，所以下沉到父元素的下面，父元素覆盖了图片，但是 img 还是在 body 的背景色之上，**因为遵循 7 阶层叠水平，最底下一定会是层叠上下文(body 元素)的 background 或者 border。

但是如果我们让 .box 元素创建局部层叠上下文的时候就不一样了，.box 元素和 img 元素的也是同处于相同层叠上下文，只不过上下文切换为了 .box 创建的局部层叠上下文。

[demo 地址](https://jsfiddle.net/lindz/vpynp7y8/7/)

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/10.jpg)

你会发现：img 元素覆盖了 .box 的背景色，因为层叠上下文的背景色永远是在最低下，层叠上下文由 body 元素变为了 .box 元素，但是如果是 .box 下的 span 元素和 img 元素的比较，inline 元素高于 z-index 为负值的元素，所以 2222 显示在图片之上。

通过这个例子是想说明，父子元素的层叠比较有可能父元素是局部层叠上下文，也可能不是局部层叠上下文，那么就需要去寻找共同的层叠上下文。

### 不同的层叠上下文

这个就比较复杂了，可以总结成一句话：打狗还得看主人，下面让我先画了草图来说明一下：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/11.png)

页面中常见的 DOM 树大概是长这样：**这里 Root、ParentX、ChildX 均为层叠上下文元素，并非一定是 ABCD 的父元素**

1. A 元素想跟 B 或者 ChildB 元素比较，很高兴，它们属于相同层叠上下文(ChildB)下，根据层叠水平去判断就可以了
2. 如果 A 元素想跟 C 或者 ChildA 比较，那就去找它们共同的祖先层叠上下文(ParentB)，找到之后，就根据祖先层叠上下文下两个元素所在的局部层叠上下文比较层叠水平(这里就是 ChildA 和 ChildB 去比较)
3. 同理，如果 A 想跟 D 一决雌雄，那么就去找祖先层叠上下文(Root)，然后去比较 ParentA 和 ParentB 的层叠水平即可

是不是很简单，下面再通过两个简单的小示例来说明一下：

示例一：[demo 地址](https://jsfiddle.net/lindz/svnsvpe7/6/)

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/12.jpg)

**虽然 childA 的 z-index: 9999 非常大，但是在跟 parentB 或者 childB 比较的时候，它没资格去比，只能让它的老大 parentA 去比较，parentA 跟 parentB 一比较，才发现：妈呀，原来你的 z-index 为 2 比我还大，失敬失敬，所以 childA 和 parentA 只好乖乖呆在 parentB 底下。**

如果我们将例子稍微改下，让 parentA 不再创建新的层叠上下文元素：[demo 地址](https://jsfiddle.net/lindz/uwhkut63/1/)

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/13.jpg)

当 parentA 不再创建层叠上下文之后，childA 想跟 childB 比较，就不再受限于 parentA，而是直接跟 parentB 直接比较(因为 childA 和 parentB 在同一个层叠上下文)，显然 childA 在最上方，这也就是 childA 覆盖 parentB 的原因。

## 问题的解决方案

理论知识已经介绍完了，如果你理解了上面的理论，这个问题应该是小菜一碟，下面就来说说一开始问题的解决方案：

因为在每个产品项上添加了 ```transform: translateZ(0)``` 导致每一个产品项都创建了一个层叠上下文，根据前面提到规则，每个产品项里面的 DOM 元素的都是相互独立的，取决于每个产品项(每个局部层叠上下文)，又由于这些产品项的层叠水平一致(与 z-index: auto 相同)，遵循后来居上原则，这才导致了后面的元素会去覆盖前面的元素。举个简单的例子: [demo 地址](https://jsfiddle.net/lindz/y8uoafff/3/)

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/14.jpg)

就像这样，即使你在 child 上添加多大的 z-index 属性都不会改变它的层叠水平，唯一的办法就是改变 item 的 z-index 数值，由于我们覆盖的部分比较特殊，仅仅只是弹框部分，而弹框部分默认是不显示的，只有当鼠标悬浮到入口的时候才会显示，最简单的方式就是，当鼠标 hover 到 item 上的时候，将其 z-index 值变大即可，破坏后来居上的特性: [demo 地址](https://jsfiddle.net/lindz/w6v48ay0/1/)

最终简化效果：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/z-index/15.gif)

## 最佳实践

说到这其实可以结束了，我在学习的过程中，看了张鑫旭大佬之前录的视频，他提出了一些最佳实践，我觉得挺不错的，这里也简单地介绍一下：

1. 不犯二准则：对于非浮层元素，避免设置 z-index 值，z-index 值没有任何道理需要超过 2
2. 对于浮层元素，可以通过 JS 获取 body 下子元素的最大 z-index 值，然后在此基础上加 1 作为浮层元素的 z-index 值

对于非浮层元素，不要过多地去运用 z-index 去调整显示顺序，要灵活地去运用层叠水平和后来居上的准则去让元素获得正确的显示，如果是在要设置 z-index 去调整，不建议非浮层元素 z-index 数值超过 2，对于 DOM 元素，-1, 0, 1, 2 足够让元素有正确的显示顺序。

对于浮层元素，往往是第三方组件开发，当你无法确认你的浮层是否会百分百覆盖在 DOM 树上的时候，你可以去动态获取页面 body 元素下所有子元素 z-index 的最大值，在此基础加一作为浮层元素 z-index 值，用于保证该浮层元素能够显示在最上方。

## 结尾

最后的最后，本篇深入 z-index 属性已经就完结了，感觉 CSS 属性有许许多多的彩蛋，接下来有时间多接触，多总结，有时间会继续分享出来。

## 参考链接

* [CSS深入理解之z-index](https://www.imooc.com/learn/643)