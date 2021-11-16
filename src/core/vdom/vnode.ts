export interface VNodeData {
  attrs?: { [key: string]: string } // 除class和style以外的attributes
  staticClass?: string // 静态的class值
  class?: string | string[] // 动态生成的class值。由v-bind:class="..."生成的值
  staticStyle?: { [key: string]: string } // 静态的style值
  style?: { [key: string]: string } // 动态生成的style值。由v-bind:style="..."生成的值
}

/**
 * 虚拟dom
 * 用来描述真实dom节点的对象（这里用类来实现，可以用普通对象+函数的方法实现）
 */
export default class VNode {
  tag: string // 标签名
  data: VNodeData // 用来描述DOM节点的attributes，格式和attributes并不相同
  children: VNode[] // 子节点
  text: string // 文本节点的textContent
  elm: HTMLElement | Element | Text  // 所描述的真实DOM节点，可以是元素或文本节点
  key: string // 唯一的key值

  constructor(
    tag?: string,
    data?: VNodeData,
    children?: VNode[],
    text?: string,
    elm?: Element
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
  }
}

/**
 * 创建并返回一个元素型VNode实例（虚拟DOM）
 * @param tag 标签名
 * @param data 描述元素的properties的相关数据
 * @param children 子元素集合
 * @private
 */
export function createElementVNode(tag: string, data: VNodeData, children: Array<string | VNode>): VNode {
  if (children) {
    children = children.map((child) => {
      if (typeof child === 'string') {
        return createTextVNode(child)
      } else {
        return child
      }
    })
  }
  return new VNode(tag, data, children as VNode[])
}

/**
 * 创建并返回一个文本型VNode实例
 * @param text 文本字符串
 * @private
 */
export function createTextVNode(text: string): VNode {
  return new VNode(undefined, undefined, undefined, text)
}
