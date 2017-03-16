let promise = new Promise((resolve, reject) => {
	setTimeout(() => {
		throw Error('This is an error');
	});
});

promise.then(result => {
	console.log(result);
}).catch(error => {
	console.log('handle error: ', error);  // Error: This is an error
}) 