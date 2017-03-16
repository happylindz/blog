function bubble_sort(arr) {
	if(arr.length <= 1) {
		return arr;
	}
	for(let i = arr.length - 1; i >= 0; i--) {
		let flag = true;
		for(let j = i - 1; j >= 0; j--) {
			if(arr[j] > arr[j + 1]) {
				let temp = arr[j];
				arr[j] = arr[j + 1];
				arr[j + 1] = temp;
				flag = false;
			}
		}
		if(flag) {
			break;
		}
	}
	return arr;
}
console.log(bubble_sort([3, 4, 8, 1, 12, 31, 22, 2, 99, 34, 54, 11]));
