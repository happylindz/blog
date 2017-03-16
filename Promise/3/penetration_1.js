let promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Hello World!');
  }, 1000)
});

promise.then(() => {
  promise.then().then(null).then('呵呵哒').then((res) => {
    console.log(res)
  })
  promise.catch().catch(null).then('呵呵哒').then((res) => {
    console.log(res) 
  })
})
