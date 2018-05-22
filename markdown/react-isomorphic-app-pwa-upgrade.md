[原文地址](https://github.com/happylindz/blog/issues/14)

# React 同构应用 PWA 改造实践

## 前言

最近在给我的博客网站 PWA 升级，顺便就记录下 React 同构应用在使用 PWA 时遇到的问题，这里不会从头开始介绍什么是 PWA，如果你想学习 PWA 相关知识，可以看下下面我收藏的一些文章：

* [您的第一个 Progressive Web App](https://developers.google.com/web/fundamentals/codelabs/your-first-pwapp/?hl=zh-cn#app_shell_4)
* [【Service Worker】生命周期那些事儿](https://75team.com/post/lifecycle.html)
* [【PWA学习与实践】(1) 2018，开始你的PWA学习之旅](https://juejin.im/post/5ac8a67c5188255c5668b0b8)
* [Progressive Web Apps (PWA) 中文版](https://github.com/SangKa/PWA-Book-CN)

## PWA 特性

PWA 不是单纯的某项技术，而是一堆技术的集合，比如：Service Worker，manifest 添加到桌面，push、notification api 等。

而就在前不久时间，IOS 11.3 刚刚支持 Service worker 和类似 manifest 添加到桌面的特性，所以这次 PWA 改造主要还是实现这两部分功能，至于其它的特性，等 iphone 支持了再升级吧。

## Service Worker

service worker 在我看来，类似于一个跑在浏览器后台的线程，页面第一次加载的时候会加载这个线程，在线程激活之后，通过对 fetch 事件，可以对每个获取的资源进行控制缓存等。

### 明确哪些资源需要被缓存？

那么在开始使用 service worker 之前，首先需要清楚哪些资源需要被缓存?

#### 缓存静态资源

首先是像 CSS、JS 这些静态资源，因为我的博客里引用的脚本样式都是通过 hash 做持久化缓存，类似于：```main.ac62dexx.js``` 这样，然后开启强缓存，这样下次用户下次再访问我的网站的时候就不用重新请求资源。直接从浏览器缓存中读取。对于这部分资源，service worker 没必要再去处理，直接放行让它去读取浏览器缓存即可。

> 我认为如果你的站点加载静态资源的时候本身没有开启强缓存，并且你只想通过前端去实现缓存，而不需要后端在介入进行调整，那可以使用 service worker 来缓存静态资源，否则就有点画蛇添足了。

#### 缓存页面

缓存页面显然是必要的，这是最核心的部分，当你在离线的状态下加载页面会之后出现：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/react-app-pwa-upgrade/1.png)

究其原因就是因为你在离线状态下没办法加载页面，现在有了 service worker，即使你在没网络的情况下，也可以加载之前缓存好的页面了。

#### 缓存后端接口数据

缓存接口数据是需要的，但也不是必须通过 service worker 来实现，前端存放数据的地方有很多，比如通过 localstorage，indexeddb 来进行存储。这里我也是通过 service worker 来实现缓存接口数据的，如果想通过其它方式来实现，只需要注意好 url 路径与数据对应的映射关系即可。

### 缓存策略

明确了哪些资源需要被缓存后，接下来就要谈谈缓存策略了。

#### 页面缓存策略

因为是 React 单页同构应用，每次加载页面的时候数据都是动态的，所以我采取的是：

1. 网络优先的方式，即优先获取网络上最新的资源。当网络请求失败的时候，再去获取 service worker 里之前缓存的资源
2. 当网络加载成功之后，就更新 cache 中对应的缓存资源，保证下次每次加载页面，都是上次访问的最新资源
3. 如果找不到 service worker 中 url 对应的资源的时候，则去获取 service worker 对应的 ```/index.html``` 默认首页

```javascript
// sw.js
self.addEventListener('fetch', (e) => {
  console.log('现在正在请求：' + e.request.url);
  const currentUrl = e.request.url;
  // 匹配上页面路径
  if (matchHtml(currentUrl)) {
    const requestToCache = e.request.clone();
    e.respondWith(
      // 加载网络上的资源
      fetch(requestToCache).then((response) => {
        // 加载失败
        if (!response || response.status !== 200) {
          throw Error('response error');
        }
        // 加载成功，更新缓存
        const responseToCache = response.clone();
        caches.open(cacheName).then((cache) => {
          cache.put(requestToCache, responseToCache);
        });
        console.log(response);
        return response;
      }).catch(function() {
        // 获取对应缓存中的数据，获取不到则退化到获取默认首页
        return caches.match(e.request).then((response) => {
           return response || caches.match('/index.html');
        });
      })
    );
  } 
});
```

**为什么存在命中不了缓存页面的情况？**

1. 首先需要明确的是，用户在第一次加载你的站点的时候，加载页面后才会去启动 sw，所以第一次加载不可能通过 fetch 事件去缓存页面
2. 我的博客是单页应用，但是用户并不一定会通过首页进入，有可能会通过其它页面路径进入到我的网站，这就导致我在 install 事件中根本没办法指定需要缓存那些页面
3. 最终实现的效果是：用户第一次打开页面，马上断掉网络，依然可以离线访问我的站点

结合上面三点，我的方法是：第一次加载的时候会缓存 ```/index.html``` 这个资源，并且缓存页面上的数据，如果用户立刻离线加载的话，这时候并没有缓存对应的路径，比如 ```/archives``` 资源访问不到，这返回 ```/index.html``` 走异步加载页面的逻辑。

在 install 事件缓存 ```/index.html```，保证了 service worker 第一次加载的时候缓存默认页面，留下退路。

```javascript
import constants from './constants';
const cacheName = constants.cacheName;
const apiCacheName = constants.apiCacheName;
const cacheFileList = ['/index.html'];

self.addEventListener('install', (e) => {
  console.log('Service Worker 状态： install');
  const cacheOpenPromise = caches.open(cacheName).then((cache) => {
    return cache.addAll(cacheFileList);
  });
  e.waitUntil(cacheOpenPromise);
});
```

在页面加载完后，在 React 组件中立刻缓存数据：

```javascript
// cache.js
import constants from '../constants';
const apiCacheName = constants.apiCacheName;

export const saveAPIData = (url, data) => {
  if ('caches' in window) {
    // 伪造 request/response 数据
    caches.open(apiCacheName).then((cache) => {
      cache.put(url, new Response(JSON.stringify(data), { status: 200 }));
    });
  }
};

// React 组件
import constants from '../constants';
export default class extends PureComponent {
  componentDidMount() {
    const { state, data } = this.props;
    // 异步加载数据
    if (state === constants.INITIAL_STATE || state === constants.FAILURE_STATE) {
      this.props.fetchData();
    } else {
    	// 服务端渲染成功，保存页面数据
      saveAPIData(url, data);
    }
  }
}
```

**这样就保证了用户第一次加载页面，立刻离线访问站点后，虽然无法像第一次一样能够服务端渲染数据，但是之后能通过获取页面，异步加载数据的方式构建离线应用。**

![](https://raw.githubusercontent.com/happylindz/blog/master/images/react-app-pwa-upgrade/2.gif)

用户第一次访问站点，如果在不刷新页面的情况切换路由到其他页面，则会异步获取到的数据，当下次访问对应的路由的时候，则退化到异步获取数据。

![](https://raw.githubusercontent.com/happylindz/blog/master/images/react-app-pwa-upgrade/3.gif)


**当用户第二次加载页面的时候，因为 service worker 已经控制了站点，已经具备了缓存页面的能力，之后在访问的页面都将会被缓存或者更新缓存，当用户离线访问的的时候，也能访问到服务端渲染的页面了。**

![](https://raw.githubusercontent.com/happylindz/blog/master/images/react-app-pwa-upgrade/4.gif)

#### 接口缓存策略

谈完页面缓存，再来讲讲接口缓存，接口缓存就跟页面缓存很类似了，唯一的不同在于：页面第一次加载的时候不一定有缓存，但是会有接口缓存的存在(因为伪造了 cache 中的数据)，所以缓存策略跟页面缓存类似：

1. 网络优先的方式，即优先获取网络上接口数据。当网络请求失败的时候，再去获取 service worker 里之前缓存的接口数据
2. 当网络加载成功之后，就更新 cache 中对应的缓存接口数据，保证下次每次加载页面，都是上次访问的最新接口数据

所以代码就像这样(代码类似，不再赘述):

```javascript
self.addEventListener('fetch', (e) => {
  console.log('现在正在请求：' + e.request.url);
  const currentUrl = e.request.url;
  if (matchHtml(currentUrl)) {
    // ...
  } else if (matchApi(currentUrl)) {
    const requestToCache = e.request.clone();
    e.respondWith(
      fetch(requestToCache).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(apiCacheName).then((cache) => {
          cache.put(requestToCache, responseToCache);
        });
        return response;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  }
});
```

**这里其实可以再进行优化的，比如在获取数据接口的时候，可以先读取缓存中的接口数据进行渲染，当真正的网络接口数据返回之后再进行替换，这样也能有效减少用户的首屏渲染时间。当然这可能会发生页面闪烁的效果，可以添加一些动画来进行过渡。**

### 其它问题

到现在为止，已经基本上可以实现 service worker 离线缓存应用的效果了，但是还有仍然存在一些问题：

#### 快速激活 service worker

**默认情况下，页面的请求（fetch）不会通过 sw，除非它本身是通过 sw 获取的，也就是说，在安装 sw 之后，需要刷新页面才能有效果。sw 在安装成功并激活之前，不会响应 fetch或push等事件。**

因为站点是单页面应用，这就导致了你在切换路由(没有刷新页面)的时候没有缓存接口数据，因为这时候 service worker 还没有开始工作，所以在加载 service worker 的时候需要快速地激活它。代码如下：

```javascript
self.addEventListener('activate', (e) => {
  console.log('Service Worker 状态： activate');
  const cachePromise = caches.keys().then((keys) => {
    return Promise.all(keys.map((key) => {
      if (key !== cacheName && key !== apiCacheName) {
        return caches.delete(key);
      }
      return null;
    }));
  });
  e.waitUntil(cachePromise);
  // 快速激活 sw，使其能够响应 fetch 事件
  return self.clients.claim();
});
```

有的文章说还需要在 install 事件中添加 ```self.skipWaiting();``` 来跳过等待时间，但是我在实践中发现即使不添加也可以正常激活 service worker，原因不详，有读者知道的话可以交流下。

现在当你第一次加载页面，跳转路由，立刻离线访问的页面，也可以顺利地加载页面了。

#### 不要强缓存 sw.js

用户每次访问页面的时候都会去重新获取 sw.js，根据文件内容跟之前的版本是否一致来判断 service worker 是否有更新。所以如果你对 sw.js 开启强缓存的话，就将陷入死循环，因为每次页面获取到的 sw.js 都是一样，这样就无法升级你的 service worker。

另外对 sw.js 开启强缓存也是没有必要的：

1. 本身 sw.js 文件本身就很小，浪费不了多少带宽，觉得浪费可以使用协商缓存，但额外增加开发负担
2. sw.js 是在页面空闲的时候才去加载的，并不会影响用户首屏渲染速度

#### 避免改变 sw 的 URL

在 sw 中这么做是“最差实践”，要在原地址上修改 sw。

举个例子来说明为什么：

1. index.html 注册了 sw-v1.js 作为 sw
2. sw-v1.js 对 index.html 做了缓存，也就是缓存优先（offline-first）
3. 你更新了 index.html 重新注册了在新地址的 sw sw-v2.js

如果你像上面那么做，用户永远也拿不到 sw-v2.js，因为 index.html 在 sw-v1.js 缓存中，这样的话，如果你想更新为 sw-v2.js，还需要更改原来的 sw-v1.js。

### 测试

自此，我们已经完成了使用 service worker 对页面进行离线缓存的功能，如果想体验功能的话，访问我的博客：[https://lindongzhou.com](https://lindongzhou.com)

随意浏览任意的页面，然后关掉网络，再次访问，之前你浏览过的页面都可以在离线的状态下进行访问了。

> IOS 需要 11.3 的版本才支持，使用 Safari 进行访问，Android 请选择支持 service worker 的浏览器

## manifest 桌面应用

前面讲完了如何使用 service worker 来离线缓存你的同构应用，但是 PWA 不仅限于此，你还可以使用设置 manifest 文件来将你的站点添加到移动端的桌面上，从而达到趋近于原生应用的体验。

### 使用 webpack-pwa-manifest 插件

我的博客站点是通过 webpack 来构建前端代码的，所以我在社区里找到 webpack-pwa-manifest 插件用来生成 manifest.json。

首先安装好 webpack-pwa-manifest 插件，然后在你的 webpack 配置文件中添加：

```javascript
// webpack.config.prod.js
const WebpackPwaManifest = require('webpack-pwa-manifest');
module.exports = webpackMerge(baseConfig, {
  plugins: [
    new WebpackPwaManifest({
      name: 'Lindz\'s Blog',
      short_name: 'Blog',
      description: 'An isomorphic progressive web blog built by React & Node',
      background_color: '#333',
      theme_color: '#333',
      filename: 'manifest.[hash:8].json',
      publicPath: '/',
      icons: [
        {
          src: path.resolve(constants.publicPath, 'icon.png'),
          sizes: [96, 128, 192, 256, 384, 512], // multiple sizes
          destination: path.join('icons')
        }
      ],
      ios: {
        'apple-mobile-web-app-title': 'Lindz\'s Blog',
        'apple-mobile-web-app-status-bar-style': '#000',
        'apple-mobile-web-app-capable': 'yes',
        'apple-touch-icon': '//xxx.com/icon.png',
      },
    })
  ]
})
```

简单地阐述下配置信息：

1. name: 应用名称，就是图标下面的显示名称
2. short_name: 应用名称，但 name 无法显示完全时候则显示这个
3. background_color、theme_color：顾名思义，相应的颜色
4. publicPath: 设置 cdn 路径，跟 webpack 里的 publicPath 一样
5. icons: 设置图标，插件会自动帮你生成不同 size 的图片，但是图片大小必须大于最大 sizes
6. ios： 设置在 safari 中如何去添加桌面应用

设置完之后，webpack 会在构建过程中生成相应的 manifest 文件，并在 html 文件中引用，下面就是生成 manifest 文件：

```json
{
  "icons": [
    {
      "src": "/icons/icon_512x512.79ddc5874efb8b481d9a3d06133b6213.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon_384x384.09826bd1a5d143e05062571f0e0e86e7.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon_256x256.d641a3644ce20c06855db39cfb2f7b40.png",
      "sizes": "256x256",
      "type": "image/png"
    },
    {
      "src": "/icons/icon_192x192.8f11e077242cccd9c42c0cbbecd5149c.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon_128x128.cc0714ab18fa6ee6de42ef3d5ca8fd09.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon_96x96.dbfccb1a5cef8093a77c079f761b2d63.png",
      "sizes": "96x96",
      "type": "image/png"
    }
  ],
  "name": "Lindz's Blog",
  "short_name": "Blog",
  "orientation": "portrait",
  "display": "standalone",
  "start_url": ".",
  "description": "An isomorphic progressive web blog built by React & Node",
  "background_color": "#333",
  "theme_color": "#333"
}
```

html 中会引用这个文件，并且加上对 ios 添加桌面应用的支持，就像这样。

```html
<!DOCTYPE html>
<html lang=en>
<head>
  <meta name=apple-mobile-web-app-title content="Lindz's Blog">
  <meta name=apple-mobile-web-app-capable content=yes>
  <meta name=apple-mobile-web-app-status-bar-style content=#838a88>
  <link rel=apple-touch-icon href=xxxxx>
  <link rel=manifest href=/manifest.21d63735.json>
</head>
</html>
```

就这么简单，你就可以使用 webpack 来添加你的桌面应用了。

### 测试

添加完之后你可以通过 chrome 开发者工具 Application - Manifest 来查看你的 mainfest 文件是否生效：

![](https://raw.githubusercontent.com/happylindz/blog/master/images/react-app-pwa-upgrade/5.png)

这样说明你的配置生效了，安卓机会自动识别你的配置文件，并询问用户是否添加。

## 结尾

讲到这差不多就完了，等以后 IOS 支持 PWA 的其它功能的时候，到时候我也会相应地去实践其它 PWA 的特性的。现在 IOS 11.3 也仅仅支持 PWA 中的 service worker 和 app manifest 的功能，但是相信在不久的将来，其它的功能也会相应得到支持，到时候相信 PWA 将会在移动端绽放异彩的。




