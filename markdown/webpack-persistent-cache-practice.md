[原文地址](https://github.com/happylindz/blog/issues/7)

# webpack 持久化缓存实践

## 前言

最近在看 webpack 如何做持久化缓存的内容，发现其中还是有一些坑点的，正好有时间就将它们整理总结一下，读完本文你大致能够明白：

1. 什么是持久化缓存，为什么做持久化缓存?
2. webpack 如何做持久化缓存？
3. webpack 做缓存的一些注意点

## 持久化缓存

首先我们需要去解释一下，什么是持久化缓存，在现在前后端分离的应用大行其道的背景下，前端 html，css，js 往往是以一种静态资源文件的形式存在于服务器，通过接口来获取数据来展示动态内容。这就涉及到公司如何去部署前端代码的问题，所以就涉及到一个更新部署的问题，是先部署页面，还是先部署资源？

1. 先部署页面，再部署资源：在二者部署的时间间隔内，如果有用户访问页面，就会在新的页面结构中加载旧的资源，并且把这个旧版本资源当做新版本缓存起来，其结果就是：用户访问到一个样式错乱的页面，除非手动去刷新，否则在资源缓存过期之前，页面会一直处于错乱的状态。
2. 先部署资源，再部署页面：在部署时间间隔内，有旧版本的资源本地缓存的用户访问网站，由于请求的页面是旧版本，资源引用没有改变，浏览器将直接使用本地缓存，这样属于正常情况，但没有本地缓存或者缓存过期的用户在访问网站的时候，就会出现旧版本页面加载新版本资源的情况，导致页面执行错误。

所以我们需要一种部署策略来保证在更新我们线上的代码的时候，线上用户也能平滑地过渡并且正确打开我们的网站。

推荐先看这个回答：[大公司里怎样开发和部署前端代码？](https://www.zhihu.com/question/20790576/answer/32602154)

当你读完上面的回答，大致就会明白，现在比较成熟的持久化缓存方案就是在静态资源的名字后面加 hash 值，因为每次修改文件生成的 hash 值不一样，这样做的好处在于增量式发布文件，避免覆盖掉之前文件从而导致线上的用户访问失效。

因为只要做到每次发布的静态资源(css, js, img)的名称都是独一无二的，那么我就可以：

* 针对 html 文件：不开启缓存，把 html 放到自己的服务器上，关闭服务器的缓存，自己的服务器只提供 html 文件和数据接口
* 针对静态的 js，css，图片等文件：开启 cdn 和缓存，将静态资源上传到 cdn 服务商，我们可以对资源开启长期缓存，因为每个资源的路径都是独一无二的，所以不会导致资源被覆盖，保证线上用户访问的稳定性。
* 每次发布更新的时候，先将静态资源(js, css, img) 传到 cdn 服务上，然后再上传 html 文件，这样既保证了老用户能否正常访问，又能让新用户看到新的页面。

上面大致介绍了下主流的前端持久化缓存方案，那么我们为什么需要做持久化缓存呢？

1. 用户使用浏览器第一次访问我们的站点时，该页面引入了各式各样的静态资源，如果我们能做到持久化缓存的话，可以在 http 响应头加上 Cache-control 或 Expires 字段来设置缓存，浏览器可以将这些资源一一缓存到本地。
2. 用户在后续访问的时候，如果需要再次请求同样的静态资源，且静态资源没有过期，那么浏览器可以直接走本地缓存而不用再通过网络请求资源。

## webpack 如何做持久化缓存

上面简单介绍完持久化缓存，下面这个才是重点，那么我们应该如何在 webpack 中进行持久化缓存的呢，我们需要做到以下两点：

1. 保证 hash 值的唯一性，即为每个打包后的资源生成一个独一无二的 hash 值，只要打包内容不一致，那么 hash 值就不一致。
2. 保证 hash 值的稳定性，我们需要做到修改某个模块的时候，只有受影响的打包后文件 hash 值改变，与该模块无关的打包文件 hash 值不变。

hash 文件名是实现持久化缓存的第一步，目前 webpack 有两种计算 hash 的方式([hash] 和 [chunkhash])

* hash 代表每次 webpack 在编译的过程中会生成唯一的 hash 值，在项目中任何一个文件改动后就会被重新创建，然后 webpack 计算新的 hash 值。
* chunkhash 是根据模块计算出来的 hash 值，所以某个文件的改动只会影响它本身的 hash 值，不会影响其他文件。

所以如果你只是单纯地将所有内容打包成同一个文件，那么 hash 就能够满足你了，如果你的项目涉及到拆包，分模块进行加载等等，那么你需要用 chunkhash，来保证每次更新之后只有相关的文件 hash 值发生改变。

所以我们在一份具有持久化缓存的 webpack 配置应该长这样：

```javascript
module.exports = {
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: '[name].[chunkhash:8].js',
  }
}
```

上面代码的含义就是：以 index.js 为入口，将所有的代码全部打包成一个文件取名为 index.xxxx.js 并放到 dist 目录下，现在我们可以在每次更新项目的时候做到生成新命名的文件了。

如果是应付简单的场景，这样做就够了，但是在大型多页面应用中，我们往往需要对页面进行性能优化：

1. 分离业务代码和第三方的代码：之所以将业务代码和第三方代码分离出来，是因为业务代码更新频率高，而第三方代码更新迭代速度慢，所以我们将第三方代码(库，框架)进行抽离，这样可以充分利用浏览器的缓存来加载第三方库。
2. 按需加载：比如在使用 React-Router 的时候，当用户需要访问到某个路由的时候再去加载对应的组件，那么用户没有必要在一开始的时候就将所有的路由组件下载到本地。
3. 在多页面应用中，我们往往可以将公共模块进行抽离，比如 header, footer 等等，这样页面在进行跳转的时候这些公共模块因为存在于缓存里，就可以直接进行加载了，而不是再进行网络请求了。

那么如何进行拆包，分模块进行加载，这就需要 webpack 内置插件：CommonsChunkPlugin，下面我将通过一个例子，来诠释 webpack 该如何进行配置。

本文的代码放在我的 Github 上，有兴趣的可以下载来看看：

```bash
git clone https://github.com/happylindz/blog.git
cd blog/code/multiple-page-webpack-demo
npm install
```

阅读下面的内容之前我强烈建议你看下我之前的文章：[深入理解 webpack 文件打包机制](https://github.com/happylindz/blog/issues/6)，理解 webpack 文件的打包的机制有助于你更好地实现持久化缓存。

例子大概是这样描述的：它由两个页面组成 pageA 和 pageB

```javascript
// src/pageA.js
import componentA from './common/componentA';

// 使用到 jquery 第三方库，需要抽离，避免业务打包文件过大
import $ from 'jquery';

// 加载 css 文件，一部分为公共样式，一部分为独有样式，需要抽离
import './css/common.css'
import './css/pageA.css';

console.log(componentA);
console.log($.trim('    do something   '));

// src/pageB.js
// 页面 A 和 B 都用到了公共模块 componentA，需要抽离，避免重复加载
import componentA from './common/componentA';
import componentB from './common/componentB';
import './css/common.css'
import './css/pageB.css';

console.log(componentA);
console.log(componentB);

// 用到异步加载模块 asyncComponent，需要抽离，加载首屏速度
document.getElementById('xxxxx').addEventListener('click', () => {
  import( /* webpackChunkName: "async" */
    './common/asyncComponent.js').then((async) => {
      async();
  })
})

// 公共模块基本长这样
export default "component X";
```

上面的页面内容基本简单涉及到了我们拆分模块的三种模式：拆分公共库，按需加载和拆分公共模块。那么接下来要来配置 webpack：

```javascript
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
  entry: {
    pageA: [path.resolve(__dirname, './src/pageA.js')],
    pageB: path.resolve(__dirname, './src/pageB.js'),
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'js/[name].[chunkhash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].js'
  },
  module: {
    rules: [
      {
        // 用正则去匹配要用该 loader 转换的 CSS 文件
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: ["css-loader"]
        })  
      }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 2,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: ({ resource }) => (
        resource && resource.indexOf('node_modules') >= 0 && resource.match(/\.js$/)
      )
    }),
    new ExtractTextPlugin({
      filename: `css/[name].[chunkhash:8].css`,
    }),
  ]
}
```

第一个 CommonsChunkPlugin 用于抽离公共模块，相当于是说 webpack 大佬，如果你看到某个模块被加载两次即以上，那么请你帮我移到 common chunk 里面，这里 minChunks 为 2，粒度拆解最细，你可以根据自己的实际情况，看选择是用多少次模块才将它们抽离。

第二个 CommonsChunkPlugin 用来提取第三方代码，将它们进行抽离，判断资源是否来自 node_modules，如果是，则说明是第三方模块，那就将它们抽离。相当于是告诉 webpack 大佬，如果你看见某些模块是来自 node_modules 目录的，并且名字是 .js 结尾的话，麻烦把他们都移到 vendor chunk 里去，如果 vendor chunk 不存在的话，就创建一个新的。

这样配置有什么好处，随着业务的增长，我们依赖的第三方库代码很可能会越来越多，如果我们专门配置一个入口来存放第三方代码，这时候我们的 webpack.config.js 就会变成：

```javascript
// 不利于拓展
module.exports = {
  entry: {
    app: './src/main.js',
    vendor: [
      'vue',
      'axio',
      'vue-router',
      'vuex',
      // more
    ],
  },
}
```

第三个 ExtractTextPlugin 插件用于将 css 从打包好的 js 文件中抽离，生成独立的 css 文件，想象一下，当你只是修改了下样式，并没有修改页面的功能逻辑，你肯定不希望你的 js 文件 hash 值变化，你肯定是希望 css 和 js 能够相互分开，且互不影响。

运行 webpack 后可以看到打包之后的效果:

```
├── css
│   ├── common.2beb7387.css
│   ├── pageA.d178426d.css
│   └── pageB.33931188.css
└── js
    ├── async.03f28faf.js
    ├── common.2beb7387.js
    ├── pageA.d178426d.js
    ├── pageB.33931188.js
    └── vendor.22a1d956.js
```

可以看出 css 和 js 已经分离，并且我们对模块进行了拆分，保证了模块 chunk 的唯一性，当你每次更新代码的时候，会生成不一样的 hash 值。

唯一性有了，那么我们需要保证 hash 值的稳定性，试想下这样的场景，你肯定不希望你修改某部分的代码(模块，css)导致了文件的 hash 值全变了，那么显然是不明智的，那么我们去做到 hash 值变化最小化呢？

换句话说，我们就要找出 webpack 编译中会导致缓存失效的因素，想办法去解决或优化它？

影响 chunkhash 值变化主要由以下四个部分引起的：

1. 包含模块的源代码
2. webpack 用于启动运行的 runtime 代码
3. webpack 生成的模块 moduleid(包括包含模块 id 和被引用的依赖模块 id)
4. chunkID

这四部分只要有任意部分发生变化，生成的分块文件就不一样了，缓存也就会失效，下面就从四个部分一一介绍：

### 一、源代码变化：

显然不用多说，缓存必须要刷新，不然就有问题了

### 二、webpack 启动运行的 runtime 代码：

看过我之前的文章：[深入理解 webpack 文件打包机制](https://github.com/happylindz/blog/issues/6) 就会知道，在 webpack 启动的时候需要执行一些启动代码。

```javascript
(function(modules) { 
  window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
    // ...
  };
  function __webpack_require__(moduleId) {
    // ...
  }
  __webpack_require__.e = function requireEnsure(chunkId, callback) {
    // ...
    script.src = __webpack_require__.p + "" + chunkId + "." + ({"0":"pageA","1":"pageB","3":"vendor"}[chunkId]||chunkId) + "." + {"0":"e72ce7d4","1":"69f6bbe3","2":"9adbbaa0","3":"53fa02a7"}[chunkId] + ".js";
  };
})([]);
```

大致内容像上面这样，它们是 webpack 的一些启动代码，它们是一些函数，告诉浏览器如何加载 webpack 定义的模块。

其中有一行代码每次更新都会改变的，因为启动代码需要清楚地知道 chunkid 和 chunkhash 值得对应关系，这样在异步加载的时候才能正确地拼接出异步 js 文件的路径。

那么这部分代码最终放在哪个文件呢？因为我们刚才配置的时候最后生成的 common chunk 模块，那么这部分运行时代码会被直接内置在里面，这就导致了，我们每次更新我们业务代码(pageA, pageB, 模块)的时候， common chunkhash 会一直变化，但是这显然不符合我们的设想，因为我们只是要用 common chunk 用来存放公共模块(这里指的是 componentA)，那么我 componentA 都没去修改，凭啥 chunkhash 需要变了。

所以我们需要将这部分 runtime 代码抽离成单独文件.

```javascript
module.exports = {
  // ...
  plugins: [
    // ...
    // 放到其他的 CommonsChunkPlugin 后面
    new webpack.optimize.CommonsChunkPlugin({
      name: 'runtime',
      minChunks: Infinity,
    }),
  ]
}
```

这相当于是告诉 webpack 帮我把运行时代码抽离，放到单独的文件中。

```
├── css
│   ├── common.4cc08e4d.css
│   ├── pageA.d178426d.css
│   └── pageB.33931188.css
└── js
    ├── async.03f28faf.js
    ├── common.4cc08e4d.js
    ├── pageA.d178426d.js
    ├── pageB.33931188.js
    ├── runtime.8c79fdcd.js
    └── vendor.cef44292.js
```

多生成了一个 runtime.xxxx.js，以后你在改动业务代码的时候，common chunk 的 hash 值就不会变了，取而代之的是 runtime chunk hash 值会变，既然这部分代码是动态的，可以通过 chunk-manifest-webpack-plugin 将他们 inline 到 html 中，减少一次网络请求。

### 三、webpack 生成的模块 moduleid

在 webpack2 中默认加载 OccurrenceOrderPlugin 这个插件，OccurrenceOrderPlugin 插件会按引入次数最多的模块进行排序，引入次数的模块的 moduleId 越小，但是这仍然是不稳定的，随着你代码量的增加，虽然代码引用次数的模块 moduleId 越小，越不容易变化，但是难免还是不确定的。

> 默认情况下，模块的 id 是这个模块在模块数组中的索引。OccurenceOrderPlugin 会将引用次数多的模块放在前面，在每次编译时模块的顺序都是一致的，如果你修改代码时新增或删除了一些模块，这将可能会影响到所有模块的 id。

最佳实践方案是通过 HashedModuleIdsPlugin 这个插件，这个插件会根据模块的相对路径生成一个长度只有四位的字符串作为模块的 id，既隐藏了模块的路径信息，又减少了模块 id 的长度。

这样一来，改变 moduleId 的方式就只有文件路径的改变了，只要你的文件路径值不变，生成四位的字符串就不变，hash 值也不变。增加或删除业务代码模块不会对 moduleid 产生任何影响。

```javascript
module.exports = {
  plugins: [
    new webpack.HashedModuleIdsPlugin(),
    // 放在最前面
    // ...
  ]
}
```

### 四、chunkID

实际情况中分块的个数的顺序在多次编译之间大多都是固定的, 不太容易发生变化。

这里涉及的只是比较基础的模块拆分，还有一些其它情况没有考虑到，比如异步加载组件中包含公共模块，可以再次将公共模块进行抽离。形成异步公共 chunk 模块。有想深入学习的可以看这篇文章：[Webpack 大法之 Code Splitting](https://zhuanlan.zhihu.com/p/26710831)

## webpack 做缓存的一些注意点

1. CSS 文件 hash 值失效的问题
2. 不建议线上发布使用 DllPlugin 插件

### CSS 文件 hash 值失效的问题：

ExtractTextPlugin 有个比较严重的问题，那就是它生成文件名所用的[chunkhash]是直接取自于引用该 css 代码段的 js chunk ；换句话说，如果我只是修改 css 代码段，而不动 js 代码，那么最后生成出来的 css 文件名依然没有变化。

所以我们需要将 ExtractTextPlugin 中的 chunkhash 改为 contenthash，顾名思义，contenthash 代表的是文本文件内容的 hash 值，也就是只有 style 文件的 hash 值。这样编译出来的 js 和 css 文件就有独立的 hash 值了。

```javascript
module.exports = {
  plugins: [
    // ...
    new ExtractTextPlugin({
      filename: `css/[name].[contenthash:8].css`,
    }),
  ]
}
```

如果你使用的是 webpack2，webpack3，那么恭喜你，这样就足够了，js 文件和 css 文件修改都不会影响到相互的 hash 值。那如果你使用的是 webpack1，那么就会出现问题。

具体来讲就是 webpack1 和 webpack 在计算 chunkhash 值得不同：

webpack1 在涉及的时候并没有考虑像 ExtractTextPlugin 会将模块内容抽离的问题，所以它在计算 chunkhash 的时候是通过打包之前模块内容去计算的，也就是说在计算的时候 css 内容也包含在内，之后才将 css 内容抽离成单独的文件，

那么就会出现：如果只修改了 css 文件，未修改引用的 js 文件，那么编译输出的 js 文件的 hash 值也会改变。

对此，webpack2 做了改进，它是基于打包后文件内容来计算 hash 值的，所以是在 ExtractTextPlugin 抽离 css 代码之后，所以就不存在上述这样的问题。如果不幸的你还在使用 webpack1，那么推荐你使用 md5-hash-webpack-plugin 插件来改变 webpack 计算 hash 的策略。

### 不建议线上发布使用 DllPlugin 插件

为什么这么说呢？因为最近有朋友来问我，他们 leader 不让在线上用 DllPlugin 插件，来问我为什么？

DllPlugin 本身有几个缺点：

1. 首先你需要额外多配置一份 webpack 配置，增加工作量。
2. 其中一个页面用到了一个体积很大的第三方依赖库而其它页面根本不需要用到，但若直接将它打包在 dll.js 里很不值得，每次页面打开都要去加载这段无用的代码，无法使用到 webpack2 的 Code Splitting 功能。
3. 第一次打开的时候需要下载 dll 文件，因为你把很多库全部打在一起了，导致 dll 文件很大，首次进入页面加载速度很慢。

虽然你可以打包成 dll 文件，然后让浏览器去读取缓存，这样下次就不用再去请求，比如你用 lodash 其中一个函数，而你用dll会将整个 lodash 文件打进去，这就会导致你加载无用代码过多，不利于首屏渲染时间。

我认为的正确的姿势是：

1. 像 React、Vue 这样整体性偏强的库，可以生成 vendor 第三方库来去做缓存，因为你一般技术体系是固定的，一个站点里面基本上都会用到统一技术体系，所以生成 vendor 库用于缓存。
2. 像 antd、lodash 这种功能性组件库，可以通过 tree shaking 来进行消除，只保留有用的代码，千万不要直接打到 vendor 第三方库里，不然你讲大量执行无用的代码。

## 结语

好了，感觉我又扯了很多，最近在看 webpack 确实收获不少，希望大家能从文章中也能有所收获。另外推荐再次推荐一下我之前写的文章，能够更好地帮你理解文件缓存机制：[深入理解 webpack 文件打包机制](https://github.com/happylindz/blog/issues/6)


## 参考链接：

* [Webpack中hash与chunkhash的区别，以及js与css的hash指纹解耦方案](http://www.cnblogs.com/ihardcoder/p/5623411.html)
* [webpack多页应用架构系列（十六）：善用浏览器缓存，该去则去，该留则留](https://segmentfault.com/a/1190000010317802)
* [用 webpack 实现持久化缓存](https://sebastianblade.com/using-webpack-to-achieve-long-term-cache/)
* [Webpack 真正的持久缓存实现](http://blog.yunfei.me/blog/webpack_long_term_caching.html)