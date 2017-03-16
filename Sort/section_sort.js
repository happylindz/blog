function section_sort(arr) {
	if(arr.length == 0) {
		return arr;
	}
	let last = arr.length - 1;
	for(let i = 0; i < arr.length; i++) {
		let front = 0;
		for(let j = 0; j <= last; j++) {
			if(arr[front] < arr[j]) {
				front = j;
			}
		}
		let temp = arr[front];
		arr[front] = arr[last];
		arr[last] = temp;
		last -= 1;
	}
	return arr;
}

console.log(section_sort([3, 4, 8, 1, 12, 31, 22, 2, 99, 34, 54, 11]));
