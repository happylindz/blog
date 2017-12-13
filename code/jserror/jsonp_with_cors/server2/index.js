const Koa = require('koa');
const path = require('path');
const route = require('koa-route');
const cors = require('koa-cors');
const app = new Koa();

app.use(cors());
app.use(route.get('/data', (ctx) => {
  const callback = ctx.query.callback;
  ctx.response.body = `${callback}(data)`;
}))
app.listen(8081, () => {
  console.log('koa app listening at 8081')
});