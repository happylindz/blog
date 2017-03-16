let promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Hello World!');
  }, 1000)
});

let a = promise.then('呵呵哒');
a.then(res => {
	console.log(res);
});

let b = promise.catch('呵呵哒');
b.then(res => {
	console.log(res);
})