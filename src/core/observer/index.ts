import Dep from './dep'
import {AnyObject} from '../../shared/util'

/**
 * 将目标对象转化成被观察对象
 * 遍历对象的属性，把每个属性用Object.defineProperty方法转换成getter/setter
 * 通过getter/setter收集依赖和发送通知
 */
export class Observer {
  constructor(obj: AnyObject) {
    // 通过定义不可遍历的属性'__ob__'， 将实例附加到目标对象上。已附加的对象则表示已经转化过了
    def(obj, '__ob__', this)
    this.walk(obj)
  }

  /**
   *  遍历目标对象的所有属性，将属性转换成getter/setter
   */
  walk(obj: AnyObject) {
    const keys = Object.keys(obj)
    keys.forEach((key) => {
      defineReactive(obj, key)
    })
  }
}

/**
 * 将未转化的对象调用Observer将其转化
 */
export function observe(obj: AnyObject): Observer {
  // 如果不是对象则不处理
  if (typeof obj !== 'object') {
    return
  }
  // 已转化的，返回对应的Observe实例，未转化的调用Observer将其转化
  return obj['__ob__'] || new Observer(obj)
}

/**
 * 转换对象属性为getter/setter
 * 如果对象属性值是对象，则同时转化这个对象为被观察对象
 * （通过这样循环调用，可以递归转化所有后代对象属性为getter/setter）
 * 为这个对象属性创建一个dep(依赖管理器)
 * 当相关依赖（即会读取这个属性值的依赖）触碰这个属性（读取值）时，会触发getter，此时dep收集这个依赖
 * 当这个对象属性写值时，会触发setter，此时dep会通知所有收集来的依赖：值变了，你去把对应的视图更新了
 */

export function defineReactive(obj: AnyObject, key: string) {
  let val = obj[key]
  // 方法内部会判断，如果对象属性对应的值是对象，则转化这个对象为被观察对象
  observe(val)
  // 为这个对象属性创建一个dep(依赖管理器)
  const dep = new Dep()
  // 转换对象属性为getter/setter
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      // 依赖触碰这个getter前会将依赖放在Dep.target上。所以如果Dep.target存在，则收集这个依赖
      if (Dep.target) {
        // 收集依赖
        dep.depend()
      }
      return val
    },
    set(newVal) {
      if (newVal === val) {
        return
      }
      val = newVal
      // 重新写值后，需要重新把后代属性都转成被观察对象
      observe(val)
      // 值发生变化，通知依赖
      dep.notify()
    },
  })
}

/**
 * 定义一个属性（主要用来定义一个不可遍历的属性）
 */
export function def (obj: AnyObject, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true,
  })
}
