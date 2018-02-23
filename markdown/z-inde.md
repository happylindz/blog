[原文地址](https://github.com/happylindz/blog/issues/11)

# 重新认识 z-index 

## 前言

最近在使用 CSS3 动画的时候遇到一个 DOM 层叠的问题，故此重新学习了一下 z-index，感觉这个 CSS 属性还是挺复杂的，希望本文可以帮助你重新认识 z-index 的魅力。

事情的经过是这样的(背景有点长)，最近在写下面这样的列表页：

![](/Users/lindongzhou/blog/images/z-index/1.png)

然后给每个产品项添加一个 CSS3 动画，动画效果大概像这样: [Demo 地址](https://codepen.io/jasonheecs/pen/GNNwpZ)

实现后的效果大概是这样的(截图有点糊，建议点 Demo 地址查看)：

![](/Users/lindongzhou/blog/images/z-index/2.gif)

在 Chrome 上显示正常，但是从 Safari 打开，就发现不得了了，动画十分卡顿：

![](/Users/lindongzhou/blog/images/z-index/3.gif)

在切换不同的产品项的时候会发现页面动画明显卡顿，想到这，其实这难不倒我，于是我就给每个产品项添加 3D 动画硬件加速，方法也十分简单，就像下面这样。

```css
.item {
  transform: translateZ(0);      // 或者 will-change: transform;
}
```

这是一种常见的硬件加速的优化方式， 如果不懂的话可以看这个：[用CSS开启硬件加速来提高网站性能](https://www.cnblogs.com/rubylouvre/p/3471490.html)

之后打开 Safari 后发现页面动画十分流畅，硬件加速的优化成功，但是随之而来又出现新的问题，也就是本文所说的 DOM 层叠问题。

![](/Users/lindongzhou/blog/images/z-index/4.png)

虽然动画效果卡顿修复了，但是页面 DOM 层叠却出现问题：也就是下面的产品项会覆盖上面产品项右下角的入口弹框，而我们希望的正常的效果应该是这样：

![](/Users/lindongzhou/blog/images/z-index/5.png)

遇到这样的问题，第一反应：那我将弹框的 z-index 调大不就好了，小菜一碟，但是无论我怎么调整 z-index 的值，弹框始终被下方的产品项所覆盖，一开始我也百思不得其解。

最后通过看了一些资料学习梳理，最终找到解决的办法，废话不多说，下面我就开始梳理整个 z-index 相关知识，并在最后提交上述问题的解决方案。(**下文讲解会附带很多的用例，我将代码全部贴在 jsfiddle 方便查阅，读者可以点击 demo 地址查看例子**)

## z-index 基础

首先介绍一下 z-index，z-index 属性是用来调整元素及子元素在 z 轴上的顺序，当元素发生覆盖的时候，那个元素在上面，那个元素在下面。通常来说，z-index 值较大的元素会覆盖较低的元素。

如果不考虑 CSS3，只有定位元素(position:relative/absolute/fixed)的 z-index 才有作用，如果你的 z-index 作用于一个非定位元素(一些 CSS3 也会生效)，是不起任何作用的。比如: [demo 地址](https://jsfiddle.net/z945msu2/1/)

当你为 DOM 元素设置了定位后，该元素的 z-index 就会生效，默认为 auto，你可以简单将它等同于 z-index: 0，比如：[demo 地址](https://jsfiddle.net/f8uwtu13/)，**也就是说，z-index 生效的前提条件是必须要设置定位属性(或者一些 CSS3 属性)，才能够生效**

看完 demo 你可能会觉得纳闷，为啥我单单只设置了一个 position 属性，没设置 z-index 值，为啥红色方格会覆盖蓝色方格，这里就涉及到了 z-index 层叠水平的知识。

## 层叠水平(stacking level)

一个 DOM 元素，在不考虑层叠上下文的情况下，会按照层叠水平决定元素在 z 轴上的显示顺序，**通俗易懂地讲，不同的 DOM 元素组合在一起发生重叠的时候，它们的的显示顺序会遵循层叠水平的规则，而 z-index 是用来调整某个元素显示顺序，使该元素能够上浮下沉。**

那么层叠水平是什么样的呢？下面就是著名的 7 阶层叠水平(stacking level)

![](/Users/lindongzhou/blog/images/z-index/6.png)

可以看出，层叠水平规范了元素重叠时候的呈现规则，有了这个规则，我们也就不难解释为何之前例子中红色方格会覆盖蓝色方格。**因为当你设置了 position: relative 属性后，元素 z-index:auto 生效导致层叠水平提升，比普通内联元素来的高，所以红色方格会显示在上方。**



## 层叠上下文

## 问题的解决方案

## 结尾