import VNode, { VNodeData } from '../vdom/vnode';
import Watcher from '../observer/watcher';
import { AnyObject } from '../../shared/util';
export interface VueOptions {
    el?: string;
    data: AnyObject;
    render?: () => VNode;
}
/**
 * Vue class
 */
export default class Vue {
    $el: HTMLElement;
    $options: AnyObject;
    $data: AnyObject;
    _renderer: () => VNode;
    _vnode: VNode;
    _data: AnyObject;
    _watcher: Watcher;
    constructor(options: any);
    /**
     * 创建并返回一个元素型VNode实例（虚拟DOM）
     * @param tag 标签名
     * @param data 描述元素的properties的相关数据
     * @param children 子元素集合
     * @private
     */
    $createElement(tag: string, data: VNodeData, children: Array<string | VNode>): VNode;
    /**
     * 根据当前数据渲染生成虚拟DOM
     */
    _render(): VNode;
    /**
     * 对比新老虚拟DOM，更新视图
     */
    _update(vnode: VNode): void;
    /**
     * 创建并返回一个元素型VNode实例（虚拟DOM）
     * @param tag 标签名
     * @param data 描述元素的properties的相关数据
     * @param children 子元素集合
     * @private
     */
    _c(tag: string, data: VNodeData, children: Array<string | VNode>): VNode;
    /**
     * 创建并返回一个文本型VNode实例
     * @param text 文本字符串
     * @private
     */
    _v(text: string): VNode;
    /**
     * 透传调用String方法
     * @param text
     * @private
     */
    _s(text: any): string;
}
