
/*\
|*|
|*| xhr
|*| axios
|*| deepCopy
|*| debounce
|*| throttle
|*| call
|*| apply
|*| bind
|*| curry
|*|
|*| trim
|*| toArray
|*| flat
|*| unique
|*| stringAdd
|*| fib
|*|
|*| myNew
|*| instanceOf
|*| Object.create
|*| strMapToObj
|*| EventEmitter / eventBus
|*| LinkNode
|*| LinkNode.prototype.append
|*| 
|*| async
|*|
\*/


// XMLHttpRequest.response 类型取决于 XMLHttpRequest.responseType 的值
let xhr = new XMLHttpRequest()
xhr.onreadystatechange = function () {
  if (xhr.readyState === 4 && xhr.status === 200) {
    console.log('xhr.response:', xhr.response)
  }
}
xhr.open('method', 'url')
// xhr.send('data')

// axios
function axios (options) {
  const { url, method, data } = options

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return
      if (xhr.status === 200) {
        resolve(xhr.response)
      } else {
        reject(xhr.statusText)
      }
    }
    xhr.open(method, url)
    xhr.send(data)
  })
}

// deepCopy 深拷贝
// https://juejin.im/post/6844903647856295949
function deepCopy (source) {
  // Object.prototype.toString.call(target)
  const newObj = source.constructor === Array ? [] : {} // 判断复制的目标是数组还是对象
  for (let key in source) { // 遍历目标
    const value = source[key]
    if (value === newObj) { // 避免相互引用对象导致死循环，如initalObj.a = initalObj的情况
      continue
    }
    if (source.hasOwnProperty(key)) {
      if (typeof value === 'object' && value !== null) { // 如果值是对象（非null），就递归一下
        newObj[key] = value.constructor === Array ? [] : {}
        newObj[key] = deepCopy(value)
      } else { // 如果不是'object'，就直接赋值
        newObj[key] = value
      }
    }
  }
  return newObj
}
var obj1 = {
  name: 'haha',
  age: 22,
  info: {
    num: 100
  }
}
var objCopy = deepCopy(obj1)
obj1.info.num = 'one hundred'
// console.log('obj1:', obj1)
// console.log('objCopy:', objCopy)

// debounce 防抖 用于输入框触发搜索、window.onresize
function debounce (fn, wait) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, wait)
  }
}

// throttle 节流 用于滚动到页面底部处罚加载，time 应是毫秒数
function throttle (fn, wait) {
  let last, timer
  return function (...args) {
    let now = +new Date() // 当前时间的毫秒数
    if (last && now < last + wait) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        last = now
        fn.apply(this, args)
      }, wait)
    } else {
      last = now
      fn.apply(this, args)
    }
  }
}

// 节流 简版
function throttle2 (fn, wait) {
  let flag = true;
  return function (...args) {
    if (!flag) return;
    flag = false;
    setTimeout(() => {
      fn.apply(this, args);
      flag = true;
    }, wait);
  }
}

let biu = function (biu) {
  console.log(biu)
  console.log('biu biu biu', biu, new Date())
}

let boom = function (boom) {
  console.log('boom boom boom', boom, new Date().Format('HH:mm:ss'))
}


// setInterval(debounce(biu, 1000), 2000, 123)
// setInterval(debounce(boom, 2000), 1000)

// setInterval(throttle(biu, 1000), 10)

// call、apply 它们的区别在于参数的形式 https://juejin.im/post/6844903773979033614
Function.prototype.myApply = function (target) {
  target.fn = this // 原型方法里的 this 指向实例对象（此时就是函数实例）
  let args = [...arguments].slice(1) // call 的参数也能处理，所以，它到底是 call 还是 apply
  target.fn(args) // 第二个参数是数组
  delete target.fn
}
obj = {
  name: 'zhangsan',
  age: 10,
}
function test1 (arg1, arg2) {
  console.log('this:', this)
  console.log(this.name + ' is ' + this.age + ' years old')
}
// test1()
// test1.myApply(obj, 1, 2)

// bind
Function.prototype.myBInd = function (target) {
  let fn = this
  let args = [...arguments].slice(1)
  return function () {
    let args2 = args.concat([...arguments])
    return fn.apply(target, args2)
  }
}
var resFn = test1.myBInd(obj, 1, 2)
console.log('resFn:', resFn)
resFn()

// 柯里化 curry
// 定义：在计算机科学中，柯里化（Currying）是把接受多个参数的函数变换成接受一个单一参数（最初函数的第一个参数）的函数，并且返回接受余下的参数且返回结果的新函数的技术。
// 缺点：Function.length属性获取函数形参数量，
// 但是Function.length参数的数量是“第一个默认参数”之前的参数的数量，也不包括rest参数。
// function add(a, b, c) { } // add.length = 3
// function add(a, b, c = 1) { } // add.length = 2
// function add(a, b = 1, c) { } // add.length = 1
// function add(a, b, ...c) { } // add.length = 2

// 我的curry：
function curry (fn) {
  return function curried (...args1) {
    if (args1.length >= fn.length) {
      return fn.apply(this, [...arguments])
    }
    return function (...args2) {
      return curried.apply(this, [...args1, ...args2])
    }
  }
}

// 柯里化-1
// add(1, 2, 3) 与 add(1)(2)(3)
// 逻辑应该是这样add(1)执行收集参数1继续执行收集参数2依次类推直到收集完毕。
function curry1 (fn) {
  console.log('fn.length:', fn.length)
  let arg = []; //用于收集参数
  //做一个闭包https://segmentfault.com/a/1190000017824877
  return function () {
    //每执行一次收集一次参数,为什么用concat是因为有时候后是多个参数(2,3)
    arg = arg.concat([...arguments]) // [...arg, ...arguments]
    //直到参数收集完成执行fn
    // 我们需要知道什么时候收集完了，条件就是curry参数fn的参数个数 fn.length
    //如果收集的参数个数大于等于fn的参数个数执行fn,如果没有递归执行
    if (arg.length >= fn.length) {
      return fn(...arg)
    }
    // 参数没有收集完我们需要继续收集，递归
    return arguments.callee
  }
}

// 柯里化 - 2
function toCurry (func, ...args) {
  // ↑需要柯里化的函数作为参数
  // ↑也可以有初始参数传入
  // ↑缓存在args中

  return function () {
    // 合并上一次缓存的参数和本次传入的参数
    args = [...args, ...arguments];
    // 判断参数数量是否足够
    if (args.length < func.length) {
      // 如果不够，继续递归
      // 注意，这里每一次递归都会形成新的闭包
      // 保证柯里化函数每一步调用都是独立的，互不影响
      return toCurry(func, ...args);
    } else
      // 如果参数满足数量，执行函数并返回结果
      return func.apply(this, args);
  }
}

function add (num1, num2, num3) {
  return num1 + num2 + num3
}
// 测试一下
let testAdd = curry(add)
// console.log('testAdd(1)(2)(3):', testAdd(1)(2)(3))

// trim 去掉首、尾的空格
function trim (str) {
  return str.replace(/^\s*|\s*$/g, '')
}
// console.log(' abc ', trim(' abc '), trim(' abc ').length)

// toArray 伪数组转化为数组
// Array.from()
// [...arr4]
// slice

// flat 数组扁平化
let arr1 = [1, [2, 3], [4, 5, [6, 7, 8]]]
// console.log(arr1.flat(Infinity))
function flatten (arr) {
  let arr2 = []
  for (let index = 0; index < arr.length; index++) {
    const ele = arr[index]
    if (Array.isArray(ele)) {
      flatten(ele)
    }
    else {
      arr2.push(ele)
    }
  }
  return arr2
}
// console.log(flatten(arr1))

// stringAdd 数组去重
let arr3 = [1, 2, 2, 3, 4, 5, 5]
// console.log(new Set(arr3))
// console.log(Array.from(new Set(arr3)))

// sort 排序
arr3.sort((a, b) => a - b) // 升序

// merge 合并两个有序数组，同归并排序的 merge 方法
function merge (arr1, arr2) {
  let arr = []
  while (arr.length && arr2.length) {
    arr.push(arr1[0] < arr2[0] ? arr1.shift() : arr2.shift())
  }
  return arr.concat(arr1, arr2) // [...arr, ...arr1, ...arr2]
}

// filter ES6数组方法
Array.prototype.filterr = function (fn) {
  // console.log('this:', this)
  const arr = this
  let newArr = []
  arr.forEach((item, index, arr) => {
    let result = fn.call(arr, item, index, arr)
    // const result = fn(item, index, arr)
    if (result) newArr.push(item)
  })
  return newArr
}

let arr4 = arr3.filterr(item => {
  return item > 3
})
// console.log('arr4:', arr4)

function count (arr) {
  let result = {}
  arr.forEach(item => {
    if (result[item]) {
      result[item] += 1
    } else {
      result[item] = 1
    }
  })
  return result
}
// console.log('count([1, 1, 2, 3]):', count([1, 1, 2, 3]))

// 大数相加（参数、返回值都是字符串）
function stringAdd (str1, str2) {
  let arr1 = str1.split('').reverse();
  let arr2 = str2.split('').reverse();
  let arr3 = []

  for (let index = 0; index < arr2.length; index++) {
    const item = arr2[index]

    if (arr1[index]) {
      if (~~item + ~~arr1[index] > 9) {
        if (arr2[index + 1] !== undefined) {
          arr2[index + 1] = ~~arr2[index + 1] + 1
        } else {
          arr2[index + 1] = 1
        }
        arr3.push(~~item + ~~arr1[index] - 10)
      } else {
        arr3.push(~~item + ~~arr1[index])
      }
    } else if (item > 9) {
      arr2[index + 1] = ~~arr2[index + 1] + 1
      arr3.push(~~item - 10)
    } else {
      arr3.push(item)
    }

  }

  let str = arr3.reverse().join('')
  return str
}

// 1 1 2 3 5 8 13 21 34 55 89 144 233
// 1 2 3 4 5 6 7  8  9  10 11 12  13
// fib string 第几个斐波那契数
function bigFib (count) {
  if (count === 0) return '0'
  if (count === 1) return '1'
  let pre = '0',
    cur = '1',
    num
  for (let index = 0; index < count - 1; index++) {
    num = add(pre, cur)
    pre = cur
    cur = num

  }
  return num
}
// console.log('bigFib(5):', bigFib(5))

// fib 第几个斐波那契数
function fib (num) {
  if (num === 0) return 0
  if (num === 1) return 1
  return fib(num - 1) + fib(num - 2)
}
// console.log('fib(5):', fib(5))

// fib 数量为某个数的（或第几个斐波那契数）
function fib2 (count) {
  if (count === 0) return []
  if (count === 1) return [1]
  let pre = 0,
    num = 1,
    arr = []
  arr.push(pre)
  for (let index = 1; index < count; index++) { // 注意起始值
    arr.push(num)
    const temp = num
    num += pre
    pre = temp
  }
  return arr
}
// console.log('fib2(13):', fib2(13))

// fib 最大值小于某个数的斐波那契数列
function fib3 (target) {
  if (target < 2) return
  let pre = 0,
    num = 1,
    arr = []
  arr.push(pre)
  while (num < target) {
    arr.push(num)
    const temp = num
    num += pre
    pre = temp
  }
  return arr
}
// console.log('fib3(10):', fib3(10))

// new 操作符
function myNew (Con, ...args) {
  let obj = {}
  Object.setPrototypeOf(obj, Con) // 或者 const obj = Object.create(Con.prototype)
  const result = Con.apply(obj, args)
  return result instanceof Con ? result : obj
}

// instanceOf
function myInstanceof (left, right) {
  let proto = Object.getPrototypeOf(left)
  while (true) {
    if (proto === null) return false
    if (proto === right.prototype) return true
    proto = Object.getPrototypeOf(proto)
  }
}
// console.log({} instanceof Object) // true

// Object.create
Object.prototype.myCreate = function (proto) {
  function F () { }
  F.prototype = proto
  return new F()
}
let obj2 = { a: 1, b: 'str' }
// console.log(Object.myCreate(obj2).__proto__ === obj2)


// generator
function* example () {
  let res1 = yield foo(100)
  console.log('res1:', res1)
  let res2 = yield foo(200)
  console.log('res2:', res2)
  let res3 = yield foo(300)
  console.log('res3:', res3)
}

function foo (num) {
  setTimeout(() => {
    console.log('timer')
    iter.next(num)
  }, 1000)
}

var iter = example()
// var res = iter.next()
// console.log('res:', res)

// Map 转为对象
// 如果所有 Map 的键都是字符串，它可以转为对象。
function strMapToObj (strMap) {
  let obj = Object.create(null);
  for (let [k, v] of strMap) {
    obj[k] = v;
  }
  return obj;
}

const myMap = new Map()
  .set('yes', true)
  .set('no', false);
strMapToObj(myMap)
// { yes: true, no: false }

class EventEmitter {
  constructor() {
    this.event = {}
  }
  // 注册事件
  on (name, fn) {
    // 一个事件可能有多个监听者
    if (!this.event[name]) this.event[name] = []
    this.event[name].push(fn)
  }
  // 触发事件
  emit (name, ...args) {
    this.event[name] && this.event[name].forEach(fn => fn(...args))
  }
  // 只触发一次
  once (name, fn) {
    //在这里同时完成了对该事件的注册、对该事件的触发，并在最后取消该事件。
    const cb = (...args) => {
      // 触发
      fn(...args)
      // 取消
      this.off(name, fn)
    }
    // 监听
    this.on(name, cb)
  }
  off (name, fn) {
    if (this.event[name]) {
      let index = this.event[name].findIndex(item => item === fn)
      // let index = this.event[name].indexOf(fn)
      this.event[name].splice(index, 1)
      if (!this.event[name].length) {
        delete this.event[name]
      }
    }
  }
}

function LinkNode () {
  function Node (data) {
    this.data = data
    this.next = null
  }
  this.head = null
  this.length = 0
}

console.log('new LinkNode:', new LinkNode)

LinkNode.prototype.append = data => {
  let newNode = new Node(data)
  if (this.length === 0) {
    this.next = newNode
  }
  else {
    let current = this.head
    while (current.next) {
      current = current.next
    }
    current.next = newNode
  }
  this.length += 1
}

const evt = new EventEmitter()
evt.on('test', data => console.log(data))
setTimeout(function () {
  evt.emit('test', 123)
}, 1e3)

// 手写 class
// 实现继承，通过继承父类 prototype
function __extends (child, parent) {
  // 修改对象原型
  Object.setPrototypeOf(child, parent);
  // 寄生继承，创建一个干净的构造函数，用于继承父类的 prototype
  // 这样做的好处是，修改子类的 prototype 不会影响父类的 prototype
  function __ () {
    // 修正 constructor 指向子类
    this.constructor = child;
  }
  // 原型继承，继承父类原型属性，但是无法向父类构造函数传参
  child.prototype =
    parent === null
      ? Object.create(parent)
      : ((__.prototype = parent.prototype), new __());
}

var A = (function () {
  function A (opt) {
    this.name = opt.name;
  }
  return A;
})();

var B = (function (_super) {
  __extends(B, _super);
  function B () {
    // 借用继承，可以实现向父类传参, 使用 super 可以向父类传参
    return (_super !== null && _super.apply(this, { name: 'A' })) || this;
  }
  return B;
})(A)


const r1 = () => {
  return new Promise((resolve, reject) => {
    axios({
      url: '/getConstant/search',
      data: { parentUid: 1 },
    }).then((res) => {
      res.resultCode == 'XEMRES_OK' ? resolve(res) : reject('111')
    })
  })
}

async function queryData () {
  const response = await r1()
}