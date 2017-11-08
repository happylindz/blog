const request = require('supertest')
const views = require('../src')
const path = require('path')
const Koa = require('koa')
const should = require('should')

describe('koa-views', () => {
  it('have a render method', done => {
    const app = new Koa().use(views()).use(ctx => {
      should(ctx.render).be.ok()
      should(ctx.render).be.a.Function()
    })

    request(app.listen())
      .get('/')
      .expect(404, done)
  })

  it('default to html', done => {
    const app = new Koa().use(views(__dirname)).use(ctx => {
      return ctx.render('./fixtures/basic')
    })

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:html/)
      .expect(200, done)
  })

  it('default to [ext] if a default engine is set', done => {
    const app = new Koa()
      .use(views(__dirname, {extension: 'pug'}))
      .use(ctx => {
        return ctx.render('./fixtures/basic')
      })

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:jade/)
      .expect(200, done)
  })

  it('set and render state', done => {
    const app = new Koa()
      .use(views(__dirname, {extension: 'pug'}))
      .use(ctx => {
        ctx.state.engine = 'pug'
        return ctx.render('./fixtures/global-state')
      })

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:pug/)
      .expect(200, done)
  })

  // #25
  it('works with circular references in state', done => {
    const app = new Koa()
      .use(views(__dirname, {extension: 'pug'}))
      .use(function (ctx) {
        ctx.state = {
          a: {},
          app
        }

        ctx.state.a.a = ctx.state.a

        return ctx.render('./fixtures/global-state', {
          app,
          b: this.state,
          engine: 'pug'
        })
      })

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:pug/)
      .expect(200, done)
  })

  it('`map` given `engine` to given file `ext`', done => {
    const app = new Koa()
      .use(views(__dirname, {map: {html: 'underscore'}}))
      .use(ctx => {
        ctx.state.engine = 'underscore'
        return ctx.render('./fixtures/underscore')
      })

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:underscore/)
      .expect(200, done)
  })

  it('merges global and local state ', done => {
    const app = new Koa()
      .use(views(__dirname, {extension: 'pug'}))
      .use(ctx => {
        ctx.state.engine = 'pug'

        return ctx.render('./fixtures/state', {
          type: 'basic'
        })
      })

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:pug/)
      .expect(200, done)
  })

  it('call to the next middleware if this.render is already defined', done => {
    const app = new Koa()
      .use((ctx, next) => {
        ctx.render = true
        return next()
      })
      .use(views())
      .use(ctx => {
        ctx.body = 'hello'
      })

    request(app.listen())
      .get('/')
      .expect('hello')
      .expect(200, done)
  })

  it('allows view options to be passed in', done => {
    const app = new Koa()
      .use(
        views(__dirname, {
          map: {hbs: 'handlebars'},
          options: {
            helpers: {
              uppercase: str => str.toUpperCase()
            },

            partials: {
              subTitle: './view-options-partial'
            }
          }
        })
      )
      .use(ctx => {
        ctx.state = {title: 'my title', author: 'queckezz'}
        return ctx.render('./fixtures/view-options.hbs')
      })

    const server = request(app.listen())
    server
      .get('/')
      .expect(/MY TITLE/)
      .expect(200, () => {
        server
          .get('/')
          .expect(/MY TITLE/)
          .expect(200, done)
      })
  })

  // #23 && #27
  it('given a directory it should try to require index.[ext]', done => {
    const app = new Koa().use(views(__dirname)).use(ctx => {
      return ctx.render('./fixtures')
    })

    request(app.listen())
      .get('/')
      .expect(/defaults-to-index/)
      .expect(200, done)
  })

  // #43
  it('it should not overwrite an extension when given one', done => {
    const app = new Koa().use(views(__dirname)).use(ctx => {
      return ctx.render('./fixtures/basic.ejs')
    })

    request(app.listen())
      .get('/')
      .expect(/basic:ejs/)
      .expect(200, done)
  })

  it('it should use an engineSource other than consolidate when provided', done => {
    const app = new Koa()
      .use(
        views(__dirname, {
          engineSource: {
            foo: () => Promise.resolve('hello')
          }
        })
      )
      .use(ctx => {
        return ctx.render('./fixtures/basic.foo')
      })

    request(app.listen())
      .get('/')
      .expect(/hello/)
      .expect(200, done)
  })

  // #82
  describe('extension is ejs, frist visit basic.html then visit basic should render basic.ejs', () => {
    const app = new Koa()
      .use(
        views(__dirname, {
          extension: 'ejs'
        })
      )
      .use((ctx, next) => {
        if (ctx.path === '/html') {
          return ctx.render('./fixtures/basic.html')
        }
        return next()
      })
      .use((ctx, next) => {
        if (ctx.path === '/ejs') {
          return ctx.render('./fixtures/basic')
        }
        return next()
      })

    const server = request(app.listen())

    it('first visit html', done => {
      server
        .get('/html')
        .expect(/basic:html/)
        .expect(200, done)
    })

    it('then visit ejs should render basic basic.ejs', done => {
      server
        .get('/ejs')
        .expect(/basic:ejs/)
        .expect(200, done)
    })
  })

  // #87
  it('name with dot', done => {
    const app = new Koa().use(views(__dirname)).use(ctx => {
      return ctx.render('./fixtures/basic.test')
    })

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/basic:html/)
      .expect(200, done)
  })

  // #94
  it('nunjucks with nunjucksEnv', done => {
    const nunjucks = require('nunjucks')
    const env = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(path.join(__dirname, 'fixtures'))
    )
    env.addFilter('shorten', (str, count) => {
      return str.slice(0, count || 5)
    })

    const app = new Koa()
      .use(
        views(path.join(__dirname, 'fixtures'), {
          options: {
            nunjucksEnv: env
          },
          map: {html: 'nunjucks'}
        })
      )
      .use(ctx => {
        return ctx.render('nunjucks-filter', {
          message: 'this is a long message'
        })
      })

    request(app.listen())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(/this </)
      .expect(200, done)
  })
})
