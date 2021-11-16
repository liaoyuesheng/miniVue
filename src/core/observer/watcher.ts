import Dep from './dep'
import {noop, AnyFunction} from '../../shared/util'

/**
 * 一个watcher实例对应一个vue组件。
 * 当触碰getter时，watcher会被收集到对应的dep中。
 * 对应的dep是指这个vue组件视图会用到的属性所创建的dep，
 * 比如这个组件会用到:data.title和data.content这两个属性，那么这两个属性创建的dep都会收集这个watcher，
 * 当这两个属性值发生变化时，对应的dep就会通知他的watcher更新视图
 * 关于dep详见"./dep.ts"
 */
export default class Watcher {
  // 对应组件更新视图的方法
  getter: AnyFunction

  constructor(fn = noop) {
    this.getter = fn
    this.get()
  }

  /**
   * 更新视图
   */
  get() {
    // 将这个watcher保存在Dep.target上，方便对应的dep收集这个watcher
    Dep.target = this
    // 更新视图。更新视图的时候会触碰data的getter/setter，使对应的dep收集这个watcher
    this.getter()
    Dep.target = null
  }

  /**
   * 更新的真正方法
   * 在queueWatcher()方法中被调用
   */
  run() {
    this.get()
  }

  /**
   * 更新
   * 同一个watcher在一个JS执行队列中多次调用update()，只会在下一个JS执行队列中执行一次run()
   * 以此实现数据连续多次修改合并到一起更新一次视图
   */
  update() {
    queueWatcher(this)
  }
}

// 用来需要在下一个JS队列更新的watcher，同一个watcher只会被push一次
const queue = []
// true表示正在等待下一个JS执行队列
let waiting = false

/**
 * 将多个watcher放在下一个JS执行队列一起更新，同一个watcher只会被更新一次
 */
function queueWatcher(watcher) {
  // 如果没有在等待下一个JS执行队列，则调用nextTick来创建异步执行队列
  if (!waiting) {
    waiting = true
    nextTick().then(() => {
      // 已进入"下一个JS执行队列"，将waiting置为false
      waiting = false
      // 执行所有watcher的run()方法
      queue.forEach((watcher) => {
        watcher.run()
      })
      // 清空watcher队列
      queue.splice(0, queue.length)
    })
  }
  // 如果队列中没有这个watcher，则推入这个watcher
  if (!queue.includes(watcher)) {
    queue.push(watcher)
  }
}


// 用来保存需要放在下一个JS执行队列执行的函数
const callbacks = []
// true表示用来进入下一个JS执行队列的promise已经创建
let pending = false

/**
 * 在下一个JS执行队列中执行函数
 * 当不传callback参数时则返回一个promise
 * @param callback 回调函数
 * @param ctx 回调函数的入参或promise的结果
 */
function nextTick<T>(callback?: () => any, ctx?: T): undefined | Promise<T> {
  // 用来保存所返回的Promise内部的resolve方法
  let _resolve
  // 如果promise未创建则创建一个新的promise，否则跳过
  if (!pending) {
    pending = true
    Promise.resolve().then(() => {
      // 已进入"下一个JS执行队列"，将pending置为false
      pending = false
      // 执行所有的回调函数
      callbacks.forEach((cb) => {
        cb()
      })
      // 清空函数池
      callbacks.splice(0, queue.length)
    })
  }
  // 添加回调函数（代理函数）。使用代理函数而不是直接添加源函数的原因是：当函数执行时需要将返回的promise的状态置为"已成功"
  callbacks.push(() => {
    // 执行源函数
    if (callback) {
      callback.call(ctx)
    }
    // 将返回的promise状态置为"已成功"
    if(_resolve) {
      _resolve(ctx)
    }
  })

  if (!callback) {
    // 返回一个新的promise，并使_resolve = resolve。这样，当下一个JS执行队列执行的时候，
    // 这个promise的状态也会变成"已成功"
    return new Promise((resolve) => {
      _resolve = resolve
    })
  }
}

