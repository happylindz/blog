
Array.prototype.bubbleSort_one = function() {
    for(let i = 0, len = this.length; i < len; i++) {
        for(let j = 0; j < len - i - 1; j++) {
            if(this[j] > this[j + 1]) {
                let temp = this[j]
                this[j] = this[j + 1]
                this[j + 1] = temp
            } 
        }
    }
    return this;
}

let arr = [3, 4, 8, 1, 12, 31, 22, 2, 99, 34, 54, 11]

console.log(arr.bubbleSort_one())
