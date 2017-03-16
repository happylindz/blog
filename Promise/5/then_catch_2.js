let promise1 = Promise.resolve();
promise1.then(() => {
	throw Error('this is a error');   //UnhandledPromiseRejectionWarning: Unhandled promise rejection
}, err => {
	console.log(err);
})

let promise2 = Promise.resolve();

promise2.then(() => {
	throw Error('this is a error');  
}).catch(err => {
	console.log('handle err:', err);    //handle err: Error: this is a error
})