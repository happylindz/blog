const Router = require('koa-router')
const router = new Router()

const sessions = {}
const users = {}


const createSession = (userName) => {
    // 保证唯一即可
    let sessionId = parseInt(Math.random() * 10000000000)
    while(sessions[sessionId] !== undefined) {
        sessionId = parseInt(Math.random() * 10000000000)
    }
    const oldSessionId = users[userName]['sessionId']
    oldSessionId && delete sessions[oldSessionId]
    users[userName]['sessionId'] = sessionId
    sessions[sessionId] = {
        name: userName,
        time: 0,
    }
    return sessionId    
}

router.all('*', async (ctx, next) => {
    const url = ctx.request.url
    const sessionId = ctx.cookies.get('sessionId')
    
    if(url === '/' && (sessionId === undefined || sessions[sessionId] === undefined)) {
        return ctx.redirect('/login')
    }
    await next()
})

router.get('/', async (ctx) => {
    const sessionId = ctx.cookies.get('sessionId')    
    const session = sessions[sessionId]
    session['time']++
    return ctx.render('index', {
        title: '首页',
        name: session['name'],
        time: session['time']
    })
    
})


router.post('/login', async (ctx) => {
    const userName = ctx.request.body.name
    const password = ctx.request.body.password
    if(users[userName] != undefined && users[userName].password === password) {
        const sessionId = createSession(userName)
        ctx.cookies.set('sessionId', sessionId)
        return ctx.redirect('/')
    }else {
        return ctx.render('error', {
            title: "错误页",
            error: '登陆失败'
        })
    }
})


router.post('/register', async (ctx) => {
    const userName = ctx.request.body.name
    const password = ctx.request.body.password
    if(userName === undefined || password === undefined || users[userName] !== undefined) {
        return ctx.render('error', {
            error: '注册失败'
        })
    }else {
        users[userName] = {
            password: password,
        }
        const sessionId = createSession(userName)
        users['sessionId'] = sessionId
        ctx.cookies.set('sessionId', sessionId)
        return ctx.redirect('/')
    }
})



module.exports = router