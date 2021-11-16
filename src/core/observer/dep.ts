import Watcher from './watcher'

/**
 * 依赖管理器（采用的设计模式是观察者模式）
 * 用来收集依赖和通知依赖
 * 在本项目，"依赖"是Watcher实例
 * 一个响应式属性对应生成一个dep
 */
export default class Dep {
  // 用来临时存放需要被收集的依赖的静态属性
  static target: Watcher = null
  // 保存依赖的数组
  subs: Watcher[] = []

  // 订阅（添加依赖）
  addSub(sub: Watcher) {
    this.subs.push(sub)
  }

  // 删除订阅（删除依赖）
  removeSub(sub: Watcher) {
    const index = this.subs.indexOf(sub)
    if (index > -1) {
      this.subs.splice(index, 1)
    }
  }

  // 收集保存在Dep.target上的依赖
  depend() {
    // Dep.target存在，且不再subs中才会被收集，避免重复收集
    if (Dep.target && !this.subs.includes(Dep.target)) {
      this.addSub((Dep.target))
    }
  }

  // 发布通知
  notify() {
    // 调用所有的依赖的update()方法
    this.subs.forEach((sub) => {
      sub.update()
    })
  }
}
