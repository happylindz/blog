[原文地址](https://github.com/happylindz/blog/issues/1)

# 你可能不知道的 Promise 对象

这里不会介绍关于 Promise 相关的基础知识，如果你想学习 Promise 的话，建议看这篇文章 [Promise 对象 - ECMAScript 6入门](http://es6.ruanyifeng.com/#docs/promise)

## 一、resolve 后的执行情况

无论是 resolve, reject，都会将函数剩余的代码执行完

```javascript
const promise = new Promise((resolve, reject) => {
    console.log('mark 1');
    resolve('hello world');     // reject('hello world');
    console.log('mark 2');
});

promise.then(result => {
    console.log(result);
}).catch(err => {
    console.log(err);
});
```

相当于：

```javascript
const promise = new Promise((resolve, reject) => {
    console.log('mark 1');
    console.log('mark 2');
    resolve('hello world');     // reject('hello world');
});

promise.then(result => {
    console.log(result);
}).catch(err => {
    console.log(err);
});
```

如果你不想在 resolve 或 reject 后执行剩下的代码段，可以在 resolve 后将其返回

```javascript
const promise = new Promise((resolve, reject) => {
    console.log('mark 1');
    return resolve('hello world');     // reject('hello world');
    console.log('mark 2');             // never be here
});

promise.then(result => {
    console.log(result);
}).catch(err => {
    console.log(err);
});
```

## 二、串行执行和并行执行：

1. 串行执行：有一堆 Promise 对象，它们的执行顺序是固定的，前一个 promise 执行完后，后一个 promise 才开始执行，比如数据库查询，它们往往有前后的因果关系。  
2. 并行执行：有一堆 Promise 对象，它们的执行顺序是不固定的，没有前后因果关系，可以并发地去执行。 

 
并行执行很好解决，在 Promise中有 all 这个函数支持, Promise.all 方法用于将多个 Promise 实例，包装成一个新的 Promise 实例。当多个 Promise 实例执行完后才去执行最后新的 Promise 实例。

```javascript
const datum = [];
for(let i = 0; i < 10; i++) {
    datum.push(i);
}

Promise.all(datum.map(i => {
    return new Promise((resolve, reject) => {
	setTimeout(() => {
	    console.log(i * 200 + " ms 后执行结束");
	    resolve("第 " + (i + 1) + " 个 Promise 执行结束");
	}, i * 200);
    })
})).then((data) => {
    console.log(data);
});
```

如果不使用 Promise.all 这个方法的话，你也可以使用像 ES7 的 async/await

```javascript
const asyncFun = async () => {
    const datum = []
    for(let i = 0; i < 10; i++) {
        datum.push(new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log(i * 200 + 'ms 后执行结束')
                resolve('第 ' + (i + 1) + ' 个 Promise 执行结束')
            }, i * 200)
        }))
    }
    const result = []
    for(let promise of datum) {
        result.push(await promise)
    }
    console.log(result)
}
asyncFun()
```

串行执行：这里提供两种方式

```javascript
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
```

另外可以使用 reduce 来串行：

```javascript
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
```

## 三、值穿透问题：

```javascript
let promise = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('Hello World!');
    }, 1000)
});

promise.then('呵呵哒').then((data) => {
    console.log(data);           // Hello World
})
```

这是一种值穿透的情况，一般有下面两种情况：
promise 已经是 FULFILLED/REJECTED 时，通过 return this 实现的值穿透：

```javascript
let promise = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('Hello World!');
    }, 1000)
});

promise.then(() => {
    promise.then().then(null).then('呵呵哒').then((res) => {
        console.log(res)
    })
    promise.catch().catch(null).then('呵呵哒').then((res) => {
        console.log(res) 
    })
})
```

promise 是 PENDING 时，通过生成新的 promise 加入到父 promise 的 queue，父 promise 有值时调用 callFulfilled->doResolve 或 callRejected->doReject（因为 then/catch 传入的参数不是函数）设置子 promise 的状态和值为父 promise 的状态和值。如：

```javascript
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
```

总而言之，当你给 then() 传递一个非函数（比如一个 promise ）值的时候，它实际上会解释为 then(null) ，这会导致之前的 promise 的结果丢失。例如:

```javascript
Promise.resolve('First Value').then(Promise.resolve('Second Value')).then(null).then((value) => {
    console.log(value)    // First Value
})
```

## 四、不要在异步回调函数中使用 throw Error

不仅 reject，抛出的异常也会被作为拒绝状态被 Promise 捕获

```javascript
let promise = new Promise((resolve, reject) => {
    reject('This is an error');
});

promise.then(result => {
    console.log(result);
}).catch(error => {
    console.log('handle error: ', error);  //handle error:  Error: This is an error
}) 
```

但是，永远不要在回调队列中抛出异常，因为回调队列脱离了运行上下文环境，异常无法被当前作用域捕获。

```javascript
let promise = new Promise((resolve, reject) => {
    setTimeout(() => {
        throw Error('This is an error');
    });
});

promise.then(result => {
    console.log(result);
}).catch(error => {
    console.log('handle error: ', error);  // Error: This is an error
});
```

简单说来，回调队列指的是 JS 事件循环中的 macrotask 队列，比如 setTimeout setInterval 会插入到 macrotask 中。
如果要在回调函数中捕获异常，请使用 reject，永远不要使用 Error。
上述的代码应改成：

```javascript
let promise = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('This is an error');
    });
});

promise.then(result => {
    console.log(result);
}).catch(error => {
    console.log('handle error: ', error);  // Error: This is an error
});
```

## 五、then 的第二个参数跟 catch 的区别

我们都知道 then 的第二参数跟 catch 用法很像，都是用来进行错误处理的，比如下面这段代码：

```javascript
let promise1 = new Promise((resolve, reject) => {
    reject('this is an error');
});

promise1.then(data => {
    console.log(data);
}, err => {
    console.log('handle err:', err);    // handle err: this is an error
});

let promise2 = new Promise((resolve, reject) => {
    reject('this is an error');
});
promise2.then(data => {
    console.log(data);
}).catch(err => {
    console.log('handle err:', err);    // handle err: this is an error
});
```

当时这两者还是区别的，区别于 then 的第二参数无法处理第一参数函数中的错误。

```javascript
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
```

当你使用then( resolveHandler, rejectHandler)格式，如果 resolveHandler 自己抛出一个错误 rejectHandler 并不能捕获。
第一个 Promise 对象无法处理同级 then 中的函数抛出的异常，所以在一般情况下，最后直接使用 catch 来进行异常捕获比较保险。

## 六、处理最后 catch 函数中的异常

一般我们用 catch 来捕捉前面抛出的异常，但是如果试想一下如果最后一个 catch 函数也抛出了异常，应该怎么处理呢?

```javascript
let promise = new Promise((resolve, reject) => {
    reject('Hello World')
});

promise.catch((err) => {
    throw('Unexpected Error');   // Uncaught (in promise) Unexpected Error
})
```

面对这样的错误，不管以 then 方法或 catch 方法结尾，要是最后一个方法抛出错误，都有可能无法捕捉到（因为 Promise 内部的错误不会冒泡到全局）这里提供两种思路：
  
* 拓展 Promise.prototype 的方法，添加一个 done 函数，将错误抛向全局。

```javascript
window.onerror = (err) => {
  console.log(err);
}
Promise.prototype.done = function (onFulfilled, onRejected) {
  this.then(onFulfilled, onRejected)
    .catch(function (reason) {
      // 抛出一个全局错误
      setTimeout(() => { throw reason }, 0);
    });
};
let promise = new Promise((resolve, reject) => {
    reject('Hello World')
});

promise.catch((err) => {
    throw('Unexpected Error');     // Uncaught Unexpected Error
}).done()
```

* 在全局添加 unhandledrejection 事件捕获 Promise 异常。

```javascript
window.addEventListener("unhandledrejection", (e) =>{
    console.log(e.reason)
})    

let promise = new Promise((resolve, reject) => {
    reject('Hello World')
});

promise.catch((err) => {
    throw('Unexpected Error');     // Unexpected Error
})
```

## 七、未捕获的错误可以被恢复

```javascript
let promise = new Promise((resolve, reject) => [
    reject('Hello world')
]).then(() => {
    console.log('resolve')
})

setTimeout(() => {
    promise.catch((e) => {
        console.log(e)
    }).then(() => {
        console.log('catch resolve')
    })
}, 1000)
```

## 八、resolved 状态的 Promise 不会立即执行

```javascript
let i = 0;
Promise.resolve('resolved promise').then(() => {
    i += 2
})
console.log(i)  // 0
```

即使是 resolve 的 Promise 调用 then 方法也是异步执行。

## 九、结合 async/await 编写同步代码

1. async/await 函数可以帮助我们彻底摆脱回调地狱的烦恼，用一种同步的方式来编写异步函数。  
2. await 后面可以接数值，如果是异步请求的话可以接 Thunk 函数和 Promise 对象。

```javascript
const timeout = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms + ' passed')
        }, ms)
    })
}

const asyncFunc =  async () => {
    const value1 = await timeout(2000)
    console.log(value1)
    const value2 = await timeout(2000)
    console.log(value2)
}

asyncFunc()
console.log('now')
```

## 十、调用 then 方法返回新的 Promise 对象

```javascript
let promise1 = new Promise((resolve) => {
    resolve('Hello world')
})

let promise2 = promise1.then()

console.log(promise1 === promise2)    // false
console.log(promise1 instanceof Promise)  // true
console.log(promise2 instanceof Promise)  // true
```

每次调用 then 方法后都会返回一个新的 Promise 对象，并不是返回原本的 Promise 对象。