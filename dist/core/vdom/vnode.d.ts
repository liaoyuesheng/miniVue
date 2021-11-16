export interface VNodeData {
    attrs?: {
        [key: string]: string;
    };
    staticClass?: string;
    class?: string | string[];
    staticStyle?: {
        [key: string]: string;
    };
    style?: {
        [key: string]: string;
    };
}
/**
 * 虚拟dom
 * 用来描述真实dom节点的对象（这里用类来实现，可以用普通对象+函数的方法实现）
 */
export default class VNode {
    tag: string;
    data: VNodeData;
    children: VNode[];
    text: string;
    elm: HTMLElement | Element | Text;
    key: string;
    constructor(tag?: string, data?: VNodeData, children?: VNode[], text?: string, elm?: Element);
}
/**
 * 创建并返回一个元素型VNode实例（虚拟DOM）
 * @param tag 标签名
 * @param data 描述元素的properties的相关数据
 * @param children 子元素集合
 * @private
 */
export declare function createElementVNode(tag: string, data: VNodeData, children: Array<string | VNode>): VNode;
/**
 * 创建并返回一个文本型VNode实例
 * @param text 文本字符串
 * @private
 */
export declare function createTextVNode(text: string): VNode;
