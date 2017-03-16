const datum = [];
for(let i = 0; i < 10; i++) {
	datum.push(i);
}

datum.reduce((prev, cur) => {
	return prev.then(data => {
		console.log(data);
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				console.log(cur * 200 + " ms 后执行结束");
				resolve("第 " + (cur + 1) + " 个 Promise 执行结束");
			}, cur * 200);
		})	
	})
}, Promise.resolve(true));