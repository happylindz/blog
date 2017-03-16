const datum = [];
for(let i = 0; i < 10; i++) {
	datum.push(i);
}

let serial = Promise.resolve();

for(let i of datum) {
	serial = serial.then(data => {
		console.log(data);
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				console.log(i * 200 + " ms 后执行结束");
				resolve("第 " + (i + 1) + " 个 Promise 执行结束");
			}, i * 200);
		})	
	});
}