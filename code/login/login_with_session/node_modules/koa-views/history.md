
## 5.0.0~6.0.0

* `koa@2` is supported by default and `koa@1` is not supported
* don't compile released code to ES5 (this means you need Node_v7.6, the same as `koa@2` requires)
* [BugFix] fix error if filename contains dot
* [BugFix] default extension should not be changed
* [BugFix] fix partials not working properly in handlebars
* make consolidate engine source optional and allow configuration

## 5.0.0

* `koa@2` support by @ifraixedes

## 4.1.0

* [BugFix] state will pass now if no locals are passed

## 4.0.1

* [Bugfix] Select correct extension in order to decide if the view should be sent or rendered

## 4.0.0

### Breaking changes

* no root option -> use `views(path, ...)`
* `path` should now always be absolute (no magic anymore)

```js
// don't
app.use(views('./views'))

// do
app.use(views(__dirname + '/views'))
```

* `opts` is now always an object, no string can be passed in as engine

```js
// this
app.use(views(__dirname + '/views', 'jade'))
// is now this
app.use(views(__dirname + '/views', {
  extension: 'jade'
}))
```
* `opts.default` renamed to `opts.extension` to avoid misconceptions

### Non-breaking changes

* more robust file require


```js
// all valid (when opts.extension) set
./fixtures/index.ejs
./fixtures/index.ejs
./fixtures/index
./fixtures/
./fixtures
fixtures
```

## 3.0.0

* _Breaking_: `this.locals` is now `this.state`
* return and yield next if this.render already exists

# 2.1.2

* support default to ./index.[ext]

# 2.0.3

* Resolves circular dependencies in `this.locals`

## 2.0.0 / 4.28.2014

* default extension to .html
* better debug messages
* move default ext to options
* name middleware
* change locals behavior so they don't get set twice
* fix path confusion, hopefully.

## 1.2.0 / 2.22.2014

 * use middleware instead of direct app reference
 * `this.body = yield this.render()` -> `yield this.render()`

## 1.1.0 / 2.16.2014

 * Use a koa instance to extend koa itself instead of adding a each method on every request.
 * `this.locals =` instead of `this.locals()`

## 1.0.0 / 2.15.2014

 * Renamed project from `koa-render` to `koa-views`.
 * added `this.locals()` for per-request locals.
 * refactored API
 * more descriptive debug messages.

## 0.1.0 / 12.19.2013

 * Allowing using extension different than engine's shortname.

## 0.0.1 / 12.19.2013

 * Initial commit.
