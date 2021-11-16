import Watcher from './watcher';
/**
 * 依赖管理器（采用的设计模式是观察者模式）
 * 用来收集依赖和通知依赖
 * 在本项目，"依赖"是Watcher实例
 * 一个响应式属性对应生成一个dep
 */
export default class Dep {
    static target: Watcher;
    subs: Watcher[];
    addSub(sub: Watcher): void;
    removeSub(sub: Watcher): void;
    depend(): void;
    notify(): void;
}
