const koa = require('koa')
const serve = require('koa-static')
const views = require('koa-views')
const koaBody = require('koa-body')
const router = require('./router')

const app = new koa()

app.use(koaBody());

app.use(views(__dirname + '/views', {
    extension: 'ejs'
}))
app.use(router.routes())
    .use(router.allowedMethods());
app.use(serve(__dirname + '/public'))

app.listen(3000, () => {
    console.log('listening on port 3000')
})