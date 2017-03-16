let promise1 = new Promise((resolve, reject) => {
	reject('this is an error');
});

promise1.then(() => {
	console.log('Hello World');
}).then(data => {
	console.log(data);
}, err => {
	console.log('handle err:', err);    // handle err: this is an error
});

// let promise2 = new Promise((resolve, reject) => {
// 	reject('this is an error');
// });
// promise1.then(data => {
// 	console.log(data);
// }).catch(err => {
// 	console.log('handle err:', err);   // handle err: this is an error
// });


