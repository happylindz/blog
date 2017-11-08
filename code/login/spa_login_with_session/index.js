const koa = require('koa')
const serve = require('koa-static')
const koaBody = require('koa-body')
const router = require('./router')

const app = new koa()

app.use(koaBody());

app.use(router.routes())
    .use(router.allowedMethods());

if(process.env.NODE_ENV === 'production') {
    app.use(serve(__dirname + '/build'))    
}

// proxy
app.listen(9000, () => {
    console.log('listening on port 3000')
})