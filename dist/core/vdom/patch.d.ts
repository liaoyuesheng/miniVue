import VNode from './vnode';
/**
 * 空节点
 */
export declare const emptyNode: VNode;
/**
 * 对比新老虚拟DOM，找到有差异的节点，更新对应的真实DOM
 * @param oldVnode 老虚拟DOM，值也可以是真实DOM对象
 * @param vnode 新虚拟DOM
 */
export default function patch(oldVnode: VNode | Element, vnode: VNode): void;
