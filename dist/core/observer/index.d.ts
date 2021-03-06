import Dep from './dep';
import { AnyObject } from '../../shared/util';
/**
 * 将目标对象转化成被观察对象
 * 遍历对象的属性，把每个属性用Object.defineProperty方法转换成getter/setter
 * 通过getter/setter收集依赖和发送通知
 */
export declare class Observer {
    dep: Dep;
    constructor(obj: AnyObject | any[]);
    /**
     *  遍历目标对象的所有属性，将属性转换成getter/setter
     */
    walk(obj: AnyObject): void;
    /**
     *  遍历目标数组的成员，将成员转换成被观察对象
     */
    observeArray(array: any[]): void;
}
/**
 * 将未转化的对象调用Observer将其转化
 */
export declare function observe(obj: AnyObject): Observer;
/**
 * 转换对象属性为getter/setter
 * 如果对象属性值是对象，则同时转化这个对象为被观察对象
 * （通过这样循环调用，可以递归转化所有后代对象属性为getter/setter）
 * 为这个对象属性创建一个dep(依赖管理器)
 * 当相关依赖（即会读取这个属性值的依赖）触碰这个属性（读取值）时，会触发getter，此时dep收集这个依赖（watcher）
 * 当这个对象属性写值时，会触发setter，此时dep会通知所有收集来的依赖：值变了，你去把对应的视图更新了
 * 因为数组读写值没有对应的getter/setter，所以其响应式能力需要通过变异方法触发和数组关联的observer的dep通知依赖，
 * 所以当getter被触碰时，对应的值是数组，则数组关联的observer的dep也需要收集依赖
 */
export declare function defineReactive(obj: AnyObject, key: string): void;
/**
 * 定义一个属性（主要用来定义一个不可遍历的属性）
 */
export declare function def(obj: AnyObject | any[], key: string, val: any, enumerable?: boolean): void;
