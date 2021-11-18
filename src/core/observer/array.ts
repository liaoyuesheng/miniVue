import {def, Observer} from './index'

// 原生数组类的原型
const arrayProto = Array.prototype
// 用来保存数组变异方法集合的对象（变异方法是指下文中的mutator函数，由它代理原始的数组方法，变异方法执行时会通知视图更新）
export const arrayMethods = Object.create(arrayProto)
// 需要变异的数组方法
export const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

methodsToPatch.forEach((method) => {
  // 以键值对的形式保存变异方法到arrayMethods对象上
  def(arrayMethods, method, function mutator(...args) {
    // 调用原始数组方法
    const result = arrayProto[method].apply(this, args)

    const ob = this.__ob__ as Observer
    let inserted // 调用方法后新增元素的集合
    // 当使用push，unshift和splice方法时，数组会新增成员，相应的获取新增成员集合
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }

    // 如果有新增的成员，将这些成员转成被观察对象
    if (inserted) {
      ob.observeArray(inserted)
    }

    // 通知视图更新
    ob.dep.notify()
    return result
  })
})
