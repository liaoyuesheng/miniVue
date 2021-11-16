import { noop, AnyFunction } from '../../shared/util';
/**
 * 一个watcher实例对应一个vue组件。
 * 当触碰getter时，watcher会被收集到对应的dep中。
 * 对应的dep是指这个vue组件视图会用到的属性所创建的dep，
 * 比如这个组件会用到:data.title和data.content这两个属性，那么这两个属性创建的dep都会收集这个watcher，
 * 当这两个属性值发生变化时，对应的dep就会通知他的watcher更新视图
 * 关于dep详见"./dep.ts"
 */
export default class Watcher {
    getter: AnyFunction;
    constructor(fn?: typeof noop);
    /**
     * 更新视图
     */
    get(): void;
    /**
     * 更新的真正方法
     * 在queueWatcher()方法中被调用
     */
    run(): void;
    /**
     * 更新
     * 同一个watcher在一个JS执行队列中多次调用update()，只会在下一个JS执行队列中执行一次run()
     * 以此实现数据连续多次修改合并到一起更新一次视图
     */
    update(): void;
}
