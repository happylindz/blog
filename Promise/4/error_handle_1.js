let promise = new Promise((resolve, reject) => {
	throw Error('This is an error');
});

promise.then(result => {
	console.log(result);
}).catch(error => {
	console.log('handle error: ', error);  //handle error:  Error: This is an error
}) 