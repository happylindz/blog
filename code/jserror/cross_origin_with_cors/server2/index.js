const Koa = require('koa');
const path = require('path');
const cors = require('koa-cors');
const app = new Koa();

app.use(cors());
app.use(require('koa-static')(path.resolve(__dirname, './public')));

app.listen(8081, () => {
  console.log('koa app listening at 8081')
});