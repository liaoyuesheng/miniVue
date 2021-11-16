# 响应式系统

这里假设你已经先阅读过官方解释：[深入响应式原理](https://cn.vuejs.org/v2/guide/reactivity.html)

响应式系统主要由三个部分组成，分别由三个JavaScript类实现：Dep，Watcher和Observer。

## Dep

详见[dep.ts](dep.ts)

依赖管理器（采用的设计模式是观察者模式），
用来收集依赖和通知依赖。

在本项目，"依赖"是Watcher实例。

一个响应式属性对应生成一个dep。

当这个响应式属性读值时会收集依赖，当写值时会通知依赖。

## Watcher

详见[watcher.ts](watcher.ts)

一个watcher实例对应一个vue组件。

当触碰getter/setter时，watcher会被收集到对应的dep（依赖管理器）中。

对应的dep是指这个vue组件视图会用到的属性所创建的dep，
比如这个组件会用到:data.title和data.content这两个属性，那么这两个属性创建的dep都会收集这个watcher，
当这两个属性值发生变化时，对应的dep就会通知他的watcher更新视图

## Observer

详见[index.ts](index.ts)

将目标对象转化成被观察对象

遍历对象的属性，把每个属性用Object.defineProperty方法转换成getter/setter

通过触碰getter/setter，调用dep收集依赖和发送通知

## 小结

整个响应式系统采用观察者模式，Dep用来实现这个模式中的订阅和发布。

数据是被观察对象，由Observer将其转成"可观察"状态。

watcher是观察者，当被观察对象（数据）发生变化，watcher会收到通知。watcher收到通知后会调用其关联当Vue组件实例当相关方法来更新视图。

