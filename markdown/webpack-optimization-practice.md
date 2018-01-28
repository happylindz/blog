# webpack 大型应用优化实践

## 前言

最近在团队分享一些 webpack 技巧，于是便准备梳理出一篇博文总结一下，不过由于讲的内容太多了，无法描述的很详细，更多地是提供一个思路，希望读者感兴趣可以动手去实践实践。

## 我认为理想的 webpack 配置：

配置多份 webpack 配置，通过 webpack-merge 进行合并，

```
├── common.js
├── dll.config.js
├── webpack.base.config.js
├── webpack.dev.config.js
├── webpack.prod.config.js
// etc 同构配置，node middleware 等等
```

然后通过 npm scripts 执行 webpack 命令:

```json
{  
  "scripts": {
    "dev": "webpack-dev-server --config ./webpack.dev.config.js",
    "build": "webpack --config ./webpack.prod.config.js",
    "start": "npm run dev",
    "pre": "webpack --config ./dll.config.js"
  },
}
```

1. 公共变量，公共配置抽离，方便以后的人进行修改配置。
2. 方便开发人员查看配置，不用手动输入 ```node_modules/.bin/webpack-dev-server```，npm scripts 会自动把 ```node_modules/.bin/``` 下的指令添加到环境中。
3. 易扩展，如果需要新增配置文件，如同构配置，node middleware 配置，只需添加新配置文件，合并公有部分。

## 区分好开发环境和生产环境：

1. 开发环境：
	- 值得去配置的：
		* 优化开发体验
		* 尽可能减少构建时间
	- 不值得去配置的：
		* 代码丑化		
		* 模块拆包，持久化缓存
		* 减少打包文件大小
2. 生产环境：
	- 值得去配置的：
	 	* 模块拆包，持久化缓存
		* 尽可能减少打包文件大小
		* 代码丑化压缩
		* 尽可能减少构建时间
	- 不值得去配置的：
		* 优化开发体验
		* 开发环境才需要的配置

## 开发过程：

### 优化开发体验

#### 自动刷新 -> 模块热更新：

1. 实时预览反应更快，等待时间更短
2. 不刷新浏览器能保留当前网页的运行状态

想开启热更新，首先需要在入口文件进行配置：

```javascript
// 入口文件 
if(module.hot) {
  module.hot.accept(['./App'], () => {
    render(<App />, document.getElementById('app'))
  })
}
```

模块热更新机制：

1. 当子模块发生更新时，更新事件会一层层往上传递，也就是从 App.js 文件传递到 main.js 文件， 直到有某层的文件接受了当前变化的模块，也就是 main.js 文件中定义的 module.hot.accept(['./App'], callback)， 这时就会调用 callback 函数去执行自定义逻辑。
2. 如果事件一直往上抛到最外层都没有文件接受它，就会直接刷新网页。

最简单的方式：

直接在命令里面加上 ```webpack-dev-server --hot``` 即可开启热更新。

该参数相当于是做了：

```javascript
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
module.exports = {
  plugins: [
    new HotModuleReplacementPlugin(),
  ],
  devServer:{
    hot: true,      
  }  
};
```

当然如果你想要更加定制化的控制，你需要在 webpack 配置进行额外配置：

```javascript
const HotModuleReplacementPlugin = require('webpack/lib/HotModuleReplacementPlugin');
module.exports = webpackMerge(baseConfig, {
  plugins: [
    new HotModuleReplacementPlugin(),
  ],
  devServer: {
    // 每次构建时候自动打开浏览器并访问网址
    open: true,
    // 开启热更新
    hot: true,
    // 设置静态资源地址如：/public，从这获取你想要的一些外链资源，图片。
    contentBase: DIST_PATH,
    // 设置端口号
    port: 9000,
    // 将热更新代码注入到模块中
    inline: true,
    // 如果你希望服务器外部可访问
    host: "0.0.0.0",
    // 设置 proxy 代理
    proxy: {
      context: ['/api'],
      target: "//www.proxy.com",
      pathRewrite: {"^/api" : ""}
    },
    // 设置 https
    https: true
  }
});
```

关于 webpack 热更新原理我就不说了，感兴趣可以看下面两篇文章：

1. [Webpack 热更新实现原理分析](https://zhuanlan.zhihu.com/p/30623057)
2. [Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)

#### 配置 sourcemap

```javascript
module.exports = {
  devtool: 'source-map',
}
```

方便调试源代码

### 减少构建时间

在大型应用减少每次构建的时间十分重要，动不动几十秒的编译时间令人发指，我在经过一些实践，总结下面一些方式，至少可以让你的编译速度快 1-2 倍。

1. 减小模块查找范围，缩小 Babel 的编译范围，并使用 webpack cache 缓存模块。
2. 使用 DLLPlugin 预先打包好第三方库。
3. 使用 Happypack 加速构建
4. 不用使用 webpack css 模块化方案

首先第一点：缩小 Babel 的编译范围，并使用 webpack cache 缓存模块。

```javascript
module.exports = {
  // 减小模块的查找范围
  resolve: {
    modules: [path.resolve(__dirname, 'node_modules')],
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: [{
          loader: 'babel-loader',
          query: {
            // 将 babel 编译过的模块缓存在 webpack_cache 目录下，下次优先复用
            cacheDirectory: './webpack_cache/',
          },
        }],
        // 减少 babel 编译范围，忘记设置会让 webpack 编译慢上好几倍
        include: path.resolve(__dirname, 'src'),
      },
    ]
  },
}
```

通过这步可以快上好几秒，另外你可以使用 DLLPlugin 预先打包好第三方库，避免每次都要去编译。开启 DLLPlugin 需要你额外配置一份 webpack 配置。

```javascript
// dll.config.js
const webpack = require('webpack');
const path = require('path');
const DllPlugin = require('webpack/lib/DllPlugin')
const vendors = [
  'react',
  'react-dom',
  'react-router',
  'redux',
  'react-redux',
  'jquery',
  'antd',
  'lodash',
]
module.exports = {
  entry: {
    'dll': vendors,
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public'),
    library: '__[name]__lib',
  },
  plugins: [
    new DllPlugin({
      name: '__[name]__lib',
      path: path.join(__dirname, 'build', '[name].manifest.json'),
    }),
  ]
}
```

运行则会在 public 目录下得到 ```dll.js``` 和 ```dll.manifest.json``` 文件，然后需要在开发配置文件中关联。

```javascript
const webpack = require('webpack');

module.exports = webpackMerge(baseConfig, {
  plugins: [
    new DllReferencePlugin({
      manifest: require('./public/dll.manifest.json'),
    }),
  ]
});
```

另外需要在你的 html 模板里面引入 dll.js，webpack 不会自动帮你引入，用好这一步编译速度应该能快一倍左右的时间。

第三点就是使用 happypack 开启多核构建，webpack 之所以慢，是因为由于有大量文件需要解析和处理，构建是文件读写和计算密集型的操作，特别是当文件数量变多后，webpack 构建慢的问题会显得严重。 也就是说 Webpack 需要处理的任务需要一件件挨着做，不能多个事情一起做。

在整个 webpack 构建流程中，最耗时的流程可能就是 loader 对文件的转换操作了，因为要转换的文件数据巨多，而且这些转换操作都只能一个个挨着处理。 Happypack 的核心原理就是把这部分任务分解到多个进程去并行处理，从而减少了总的构建时间。

需要配置哪些 loader 使用 Happypack 就要改写那些配置，比如你想要修改 babel 为多核编译:

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: ['happypack/loader?id=babel'],
        include: path.resolve(__dirname, 'src'),
      },
    ]
  },
  plugins: [
    new HappyPack({
      id: 'babel',
      loaders: [{
        loader: 'babel-loader',
        query: {  
          cacheDirectory: './webpack_cache/',
        },
      }],
    })
  ],
};
```

设置 ```id=babel```，webpack 会去找 plugins 中的 id 为 babel 的插件进行处理。配置其它的 loader 的方式也是类似，不过需要注意的是有的 loader 不支持多核编译。通过这一步应该至少能让你的编译速度快 1/3。

最后一点是不要使用 webpack 里 css 模块化方案，我这里指的模块化指的是 css-loader 提供的模块化方式，我们先来看下它是怎么做的，首先它需要在你的 loader 中进行额外配置。

```javascript
module.exports = webpackMerge(baseConfig, {
  module: {
    rules: [
      {
        test: /\.css/,
        use:       [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              // 开启 css 模块
              modules: true,
              // 设置命名格式
              localIdentName: '[name]__[hash:base64:5]'
            }
          }
        ]
      },
    ]
  },
} 
```

如果通过这种 css 模块化的方式，意味着你在写 React 组件的时候，需要这样去设置：

```javascript
import styles from './index.css';

class Index extends React.Component {
  render() {
    return (
      <div className={ styles.recursive }>
        xxxx
        <h1 className={ styles.header }></h1>
      </div>
    );
  }
}
export default Index;
```

它相当于是在输出 css 文件的时候做了一层原名称到新名称的一次转化来保证 css 模块化的特性，输出的值就像这样：

```
Object {
  recursive: 'recursive__abc53xxxx',
  xxxxx: 'xxxxx__def884xxx',
}
```

这样做不好的点在哪：

1. 类名只能以驼峰式的形式出现，且每个类名需要额外添加到 React 组件当中
2. 编译速度慢的坑爹，如果你的应用中有大量的样式(数以万计)需要去解析，编译的时间至少增加一倍以上。

所以如果想要使用 css 模块化的可以尽量选择其它方案，比如 styledComponents 或者自己添加命名空间等等。

## 发布上线：

在发布上线的时候就需要考虑到很多性能优化的因素，比如如何有效地去利用浏览器的缓存，如何减少打包文件的体积等等这些因素都值得去优化。

### 高效利用浏览器缓存

关于如何高效地利用浏览器缓存，之前写过一篇文章详细描述了 [webpack 持久化缓存实践](https://github.com/happylindz/blog/issues/7)，感兴趣可以看看。

我这里做个总结，我认为 webpack 在浏览器缓存需要做到以下几点：

1. 在多页面应用中，我们需要将公共模块进行拆包，比如 header，footer，以及一些公共区域等等，这样页面在我们的网站中进行跳转的时候由于这些公共模块存在于缓存当中，就可以直接进行加载，而不是再通过网络请求。
2. 分离业务代码和第三方的代码：之所以将业务代码和第三方代码分离出来，是因为业务代码更新频率高，而第三方代码更新迭代速度慢，所以我们将第三方代码(库，框架)进行抽离，这样可以充分利用浏览器的缓存来加载第三方库。
3. 从 js 中抽离 css，使得 css 样式和 js 逻辑相对独立，这样我们在修改样式或者页面的逻辑的时候它们将互不影响到各自的缓存。
4. 抽离异步加载的内容，比如路由切割，与首屏渲染无关的内容等等。
5. 生成稳定的 hash 值，代码修改实现 hash 值变化最小，即代码修改只影响到其对应的文件 hash 值，而不要去影响到其它文件的 hash 值。

那么我们要怎样通过 webpack 来完成上面的步骤呢？

首先不建议线上发布直接全部使用 DLLPlugin 插件来开启浏览器缓存，DLLPlugin 本身有几个缺点：

1. 首先你需要额外多配置一份 webpack 配置，增加工作量。
2. 其中一个页面用到了一个体积很大的第三方依赖库而其它页面根本不需要用到，但若直接将它打包在 dll.js 里很不值得，每次页面打开都要去加载这段无用的代码，无法使用到 webpack2 的 Code Splitting 功能。
3. 有些库你并不需要使用到全部功能，比如组件库，函数库，你可以只是需要其它一小部分内容，而 DLLPlugin 插件才不管你这些，它会通通地全部打包进去，这样你就无法去使用打包体积减小的策略了(如：tree shaking)。

我认为的正确的姿势是：

* 像 React、Vue 这样整体性偏强的库，可以生成 vendor 第三方库来去做缓存，因为你一般技术体系是固定的，一个站点里面基本上都会用到统一技术体系，所以生成 vendor 库用于缓存，这部分可以通过 DLLPlugin 去做。
* 像 antd、lodash 这种功能性组件库，可以通过 tree shaking 来进行消除，只保留有用的代码，千万不要直接打到 vendor 第三方库里，不然你将大量加载执行无用的代码。

具体如何拆分模块，我在 [webpack 持久化缓存实践](https://github.com/happylindz/blog/issues/7) 已经说明，这里不再赘述。

### 减少打包文件的体积

想要减少打包后的体积，就需要使用到 webpack2 提供的 tree shaking 功能和 webpack3 提供的 scope hoisting 功能。

想要 tree shaking 生效，下面四点值得注意：

首先，模块引入要基于 ES6 模块机制，不再使用 commonjs 规范，因为 es6 模块的依赖关系是确定的，和运行时的状态无关，可以进行可靠的静态分析，然后清除没用的代码。而 commonjs 的依赖关系是要到运行时候才能确定下来的。

另外对于引用第三方模块使用 tree shaking 功能，可以设置 ```mainFields``` 用于配置采用哪个字段作为模块的入口描述。 为了让 tree shaking 对 es6 生效，需要配置 webpack 的文件寻找规则为如下：

```javascript
module.exports = {
  resolve: {
    // 针对 npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件
    mainFields: ['jsnext:main', 'browser', 'main']
  },
};
```

对于一些死代码，就像下面这样：其大致原理是借助环境变量去判断执行哪个分支。

```javascript
if (process.env.NODE_ENV === 'production') {
  console.log('你正在线上环境');
} else {
  console.log('你正在使用开发环境');
}
```

通过 shell 脚本的方式去定义的环境变量，例如 NODE_ENV=production webpack，webpack 是不认识的，对 webpack 需要处理的代码中的环境区分语句是没有作用的。

在构建线上环境代码时，需要给当前运行环境设置环境变量 NODE_ENV = 'production'，webpack 相关配置如下：

```javascript
const DefinePlugin = require('webpack/lib/DefinePlugin');
module.exports = {
  plugins: [
    new DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
  ],
};
```

这样设置后 tree shaking 能有效清除跟生产环境无关的代码。

最后需要强调，webpack 只是指出了哪些函数用上了哪些没用上，要剔除用不上的代码还得经过 UglifyJS 去处理一遍。 需要开启代码压缩， tree shaking 才能真正将无用的代码消除。

如果想要开启 Scope hoisting，需要在额外配置 ModuleConcatenationPlugin 插件，并且 Scope hoisting 对下面的情况不生效：

1. 按需加载的模块
2. 使用 commonjs 规范的模块
3. 被多 entry 共享的模块

这些我在 [深入理解 webpack 文件打包机制](https://github.com/happylindz/blog/issues/6) 都有详细阐述，这里不多说了。

### 压缩代码

压缩代码可以使用 UglifyJsPlugin 这个插件对代码进行压缩，不过用过 UglifyJsPlugin 的你一定会发现在构建用于开发环境的代码时很快就能完成，但在构建用于线上的代码时构建一直卡在一个时间点迟迟没有反应，其实卡住的这个时候就是在进行代码压缩。

由于压缩 JavaScript 代码需要先把代码解析成用 Object 抽象表示的 AST 语法树，再去应用各种规则分析和处理 AST，导致这个过程计算量巨大，耗时非常多。

遇到这种情况可以改用 ParallelUglifyPlugin 插件，当 webpack 有多个 JS 文件需要输出和压缩时，原本会使用 UglifyJsPlugin 去一个个挨着压缩再输出， 但是 ParallelUglifyPlugin 则会开启多个子进程，把对多个文件的压缩工作分配给多个子进程去完成，每个子进程其实还是通过 UglifyJsPlugin 去压缩代码，但是变成了并行执行。 所以 ParallelUglifyPlugin 能更快的完成对多个文件的压缩工作。

压缩 CSS 代码的话，因为使用到  extract-text-webpack-plugin 插件将代码从 js 中分离出来，可以通过 optimize-css-assets-webpack-plugin 插件进行压缩，详细的配置项可以看：[optimize-css-assets-webpack-plugin](https://www.npmjs.com/package/optimize-css-assets-webpack-plugin)

## 输入分析：

上面讲了很多优化方式，但是无法面面俱到，对此你需要对打包输出结果做分析，以确认下一步的优化思路。这里推荐两个打包分析工具：

1. 官方的可视化分析工具 Webpack Analyse
2. webpack-bundle-analyzer 插件

简单地介绍下第二种方式，接入方式很简单：

```javascript
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
 
module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
}
```

当你启动 webpack 时候，会唤起浏览器弹出 treemap，通过分析图可以清楚地看到：

* 打包出的文件中都包含了什么
* 每个文件的尺寸在总体中的占比，一眼看出哪些文件尺寸大
* 模块之间的包含关系

![](https://raw.githubusercontent.com/happylindz/blog/master/images/webpack-optimization/1.gif)


## 结语

本文更多地介绍一些思路，详细的优化步骤可以自己去尝试，你肯定会有更多的收获的！

参考链接：

* [深入浅出 webpack](http://webpack.wuhaolin.cn/)
