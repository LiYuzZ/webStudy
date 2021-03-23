// console.log('---------- 我的 Promise ----------')

// Promise
// resolvePromise

// then
// catch
// finally

// static resolve
// static reject

// Promise.all
// Promise.any
// Promise.allSettled
// Promise.race
// wrap

// Promise.promisify
// Promise.promisifyAll

// Promise.defer

// 使用一个队列来储存回调,是为了实现规范要求的 "一个 promise 实例，可以调用多次 then 方法"
// 使用 Promise 的，当 then 函数中 return 了一个值，不管是什么值，都能在下一个 then 中获取到，这就是所谓的then 的链式调用。
// 不在 then 中放入参数时，例：promise.then().then()，那么其后面的 then 依旧可以得到之前 then 返回的值，这就是所谓的值的穿透。

class Promise {
    constructor(executor) {
        this.status = 'pending'
        this.value = undefined
        this.reason = undefined

        this.onResolvedCallbacks = []
        this.onRejectedCallbacks = []

        let resolve = (val) => {
            // ====== Promise.resolve 新增逻辑 ======
            // 如果 val 是一个promise，那我们的库中应该也要实现一个递归解析
            if (val instanceof Promise) {
                // 递归解析
                return val.then(resolve, reject)
            }
            // ===================

            // 要点1：
            if (this.status === 'pending') {
                this.status = 'fulfilled'
                this.value = val
                this.onResolvedCallbacks.forEach(fn => fn())
            }
        }

        let reject = (rea) => {
            if (this.status === 'pending') {
                this.status = 'rejected'
                this.reason = rea
                this.onRejectedCallbacks.forEach(fn => fn())
            }
        }

        try {
            executor(resolve, reject)
        } catch (error) {
            reject(error)
        }
    }

    then(onFulfilled, onRejected) {
        // then（then1）的作用是处理成功失败回调的，但又需要返回一个 Promise（promise2），所以把 then（then1）的回调函数 push 进列表（为了支持异步任务），就需要在 Promise（promise2）内部进行；同时，Promise（promise1）实例调用 then（then1）方法后，then（then1）方法返回一个 Promise（promise2），所以其内部是必须调用 resolve、reject（promise2）方法的，这时就要判断 then（then1）的回调函数（无论是成功回调，还是失败回调）返回值data的类型了，1. 基本类型，直接 resolve(data)，2. 引用类型，判断是不是一个 Promise（promise3）实例（依据是有无 then 方法），a. 若无，执行 resolve(data)，b. 若有，就执行该 Promise（promise3）实例，在其成功回调里再次判断返回值的类型，在其失败回调里 reject(reason)。
        // 要点2：
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
        onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err }

        let promise2 = new Promise((resolve, reject) => {
            if (this.status === 'pending') {
                this.onResolvedCallbacks.push(() => {
                    // 要点3：
                    setTimeout(() => {
                        // 要点4：
                        try {
                            let x = onFulfilled(this.value)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (error) {
                            reject(error)
                        }
                    }, 0)
                })

                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onRejected(this.reason)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (error) {
                            reject(error)
                        }
                    }, 0)
                })
            }

            if (this.status === 'fulfilled') {
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.value)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                }, 0)
            }

            if (this.status === 'rejected') {
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                }, 0)
            }
        })
        return promise2
    }

    static resolve(value) {
        return new Promise((resolve, reject) => {
            resolve(value)
        })
    }

    static reject(reason) {
        return new Promise((resolve, reject) => {
            reject(reason)
        })
    }
}

const resolvePromise = (promise2, x, resolve, reject) => {
    if (x === promise2) {
        // 要点5
        return reject(new TypeError('循环引用了'))
    }
    // 要点6
    let called
    if ((typeof x === 'object' && x != null) || (typeof x === 'function')) {
        // 要点7
        try {
            let then = x.then
            if (typeof then === 'function') {
                // then( // 也可以
                // x.then( // 貌似也可以
                // Promise.resolve(x).then().catch() // 也可以
                then.call(
                    x,
                    y => {
                        if (called) return
                        called = true
                        resolvePromise(promise2, y, resolve, reject)
                    },
                    r => {
                        if (called) return
                        called = true
                        reject(r)
                    }
                )
            } else {
                resolve(x)
            }
        } catch (error) {
            if (called) return
            called = true
            reject(error)
        }
    } else {
        resolve(x)
    }
}

// 测试：链式调用、值穿透
const p11 = new Promise((resolve, reject) => {
    reject('失败');
}).then().then().then(data => {
    console.log('data:', data);
}, err => {
    console.log('err:', err);
})

Promise.prototype.catch = function (fn) {
    return this.then('', fn)
}

// 该方法内部若有promise，它的成功结果不会影响先前的promise结果，但是失败结果会替换掉之前的失败结果
Promise.prototype.finally = function (fn) {
    return this.then(
        value => Promise.resolve(fn()).then(() => value),
        reason => Promise.resolve(fn()).then(() => {throw reason})
    )
}

if (typeof Promise.prototype.done === 'undefined') {
    Promise.prototype.done = function (onFulfilled, onRejected) {
        this.then(onFulfilled, onRejected).catch(function (error) {
            setTimeout(function () {
                throw error
            }, 0)
        })
    }
}

// 只要一个失败就返回失败的原因，都成功才返回成功结果（数组）
Promise.all = function (promises) {
    return new Promise((resolve, reject) => {
        let resultArr = []
        function handleValue(value, index) {
            resultArr[index] = value
            if (resultArr.length === promises.length) {
                resolve(resultArr)
            }
        }
        promises.forEach((item, index) => {
            if (typeof item.then === 'function') {
                item.then(
                    value => handleValue(value, index),
                    reject
                )
            } else {
                handleValue(item, index)
            }
        })
    })
}

// 一个成功就返回成功的结果，所有都失败才返回失败的原因（数组）
Promise.any = function (promises) {
    return new Promise((resolve, reject) => {
        let resultArr = []
        function handleReason(value, index) {
            resultArr[index] = value
            if (resultArr.length === promises.length) {
                reject(resultArr)
            }
        }
        promises.forEach((item, index) => {
            if (typeof item.then === 'function') {
                item.then(
                    resolve,
                    reason => handleReason(reason, index),
                )
            } else {
                resolve(item)
            }
        })
    })
}

// 返回所有promise的结果，[{status: 'fulfilled || rejected', value || reason}]
Promise.allSettled = function (promises) {
    return new Promise((resolve, reject) => {
        if (promises.length === 0) return resolve([])
        let resultArr = []
        function handleResult(status, value) {
            resultArr.push(status === 'fulfilled' ? { status: 'fulfilled', value } : { status: 'rejected', reason: value })
            if (resultArr.length === promises.length) {
                resolve(resultArr)
            }
        }
        promises.forEach((item, index) => {
            if (typeof item.then === 'function') {
                item.then(
                    value => handleResult('fulfilled', value),
                    reason => handleResult('rejected', reason),
                )
                // item.then.call(
                //     item,
                //     value => handleResult('fulfilled', value),
                //     reason => handleResult('rejected', reason),
                // )
                // Promise.resolve(item).then(
                //     value => handleResult('fulfilled', value)
                // ).catch(
                //     reason => handleResult('rejected', reason)
                // )
            } else {
                handleResult('fulfilled', item)
            }
        })
    })
}

// 测试：allsettled
const resolved = Promise.resolve(1);
const rejected = Promise.reject(-1);
const resolved1 = Promise.resolve(17);
const p = Promise.allSettled([resolved, resolved1, rejected]);
p.then((results) => {
    console.log('results', results)
})

// 只要一个有结果就返回它，无论是成功还是失败
Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
        promises.forEach((item, index) => {
            if (typeof item.then === 'function') {
                item.then(
                    // value => resolve(value),
                    // reason => reject(reason)
                    resolve, reject // 都可以
                )
            } else {
                resolve(item)
            }
        })
    })
}

// 用 Promise.race 实现中断 abort
function wrap(promise) {
    // 在这里包装一个 promise，可以控制原来的 promise 是成功还是失败
    let abort
    let newPromise = new Promise((resolve, reject) => { // defer 方法
        abort = reject
    })
    let p = Promise.race([promise, newPromise]) // 任何一个先成功或者失败 就可以获取到结果
    p.abort = abort
    return p
}

const promise = new Promise((resolve, reject) => {
    setTimeout(() => { // 模拟的接口调用 ajax 肯定有超时设置
        resolve('成功')
    }, 2000)
})

let newPromise = wrap(promise)

setTimeout(() => {
    // 超过3秒 就算超时 应该让 proimise 走到失败态
    newPromise.abort('超时了')
}, 1000)

newPromise.then((data => {
    console.log('结果：' + data)
})).catch(err => {
    console.log('结果：' + err)
})

// promisify 是把一个 node 中的 api 转换成 promise 的写法。
// 在 node 版本 12.18 以上，已经支持了原生的 promisify 方法：const fs = require('fs').promises。
const promisify = (fn) => { // 典型的高阶函数 参数是函数 返回值是函数
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn(...args, function (err, data) { // node中的回调函数的参数 第一个永远是error
                if (err) return reject(err);
                resolve(data);
            })
        });
    }
}

// 如果想要把 node 中所有的 api 都转换成 promise 的写法呢：
const promisifyAll = (target) => {
    Reflect.ownKeys(target).forEach(key => {
        if (typeof target[key] === 'function') {
            // 默认会将原有的方法 全部增加一个 Async 后缀 变成 promise 写法
            target[key + 'Async'] = promisify(target[key]);
        }
    });
    return target;
}


// 实现一个promise的延迟对象 defer
// 如果没有defer的话，我们在测试过程中就会报一个TypeError: adapter.deferred is not a function.
Promise.defer = Promise.deferred = function () {
    let dfd = {}
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve
        dfd.reject = reject
    })
    return dfd
}
module.exports = Promise
