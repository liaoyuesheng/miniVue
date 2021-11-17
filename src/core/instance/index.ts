import VNode, {createElementVNode, createTextVNode, VNodeData} from '../vdom/vnode'
import patch from '../vdom/patch'
import {def, observe} from '../observer'
import Watcher from '../observer/watcher'
import {compiler} from '../../compiler'
import {AnyObject, isPlainObject, isUndef} from '../../shared/util'

export interface VueOptions {
  el?: string,
  data: AnyObject,
  render? : () => VNode,
}

/**
 * Vue class
 */
export default class Vue {
  $el: HTMLElement // 对应的真实DOM
  $options: AnyObject // 配置项
  $data: AnyObject
  _renderer: () => VNode
  _vnode: VNode // 渲染生成的虚拟DOM
  _data: AnyObject // 数据
  _watcher: Watcher // 用来通知Vue实例更新视图的Watcher实例

  constructor(options) {
    this.$options = Object.assign({}, options)
    this.$el = document.querySelector(this.$options.el)
    def(this, '$data', options.data)
    this._data = this.$data

    // 将data的每一个属性都代理到Vue实例上，这样可以直接通过Vue实例修改数据
    Object.keys(this._data).forEach((key) => {
      this[key] = this.$data[key]
      // 通过定义getter/setter，当读写Vue实例的代理属性（与data的直接子属性同名）时，实际读写的是data
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get() {
          return this.$data[key]
        },
        set(v: any) {
          this.$data[key] = v
        },
      })
    })

    // 如果没有配置render函数
    if (!this.$options.render) {
      // 字符串模板等于配置中的模板，或者真实DOM的outerHTML字符串
      const template = this.$options.template || this.$el.outerHTML
      // 编译模板为渲染函数
      this._renderer = new Function('', compiler(template)) as () => VNode
    } else {
      this._renderer = this.$options.render
    }
    // 将data对象转换成被观察对象
    observe(this.$data)
    // 新建Watcher实例。当相关数据发生变化，该watcher会被通知，从而调用fn更新该Vue实例对应的视图（即$el）
    this._watcher = new Watcher(() => {
      // 当watcher被通知，调用_render()生成新的虚拟DOM，再调用_update()更新视图
      this._update(this._render())
    })
  }

  /**
   * 创建并返回一个元素型VNode实例（虚拟DOM）
   * @param tag 标签名
   * @param data 描述元素的properties的相关数据
   * @param children 子元素集合
   * @private
   */
  $createElement(tag: string, data: VNodeData, children: Array<string | VNode>) {
    return createElementVNode(tag, data, children)
  }

  /**
   * 根据当前数据渲染生成虚拟DOM
   */
  _render(): VNode {
    // 调用渲染函数，同时将渲染函数内部的this指向Vue实例
    return this._renderer.call(this)
  }

  /**
   * 对比新老虚拟DOM，更新视图
   */
  _update(vnode: VNode) {
    // 如果this._vnode没有值，说明需要patch真实DOM和虚拟DOM
    const oldVnode = this._vnode || this.$el
    // 保存新虚拟DOM，下次patch它将作为老虚拟DOM
    this._vnode = vnode
    // patch老虚拟DOM(或真实虚拟DOM)和新虚拟DOM
    patch(oldVnode, vnode)
    // 保存新的真实DOM节点（在初次更新的时候，老$el会被删除）
    this.$el = vnode.elm as HTMLElement
  }

  // 下面的方法都是提供给渲染函数使用的

  /**
   * 创建并返回一个元素型VNode实例（虚拟DOM）
   * @param tag 标签名
   * @param data 描述元素的properties的相关数据
   * @param children 子元素集合
   * @private
   */
  _c(tag: string, data: VNodeData, children: Array<string | VNode>) {
    return createElementVNode(tag, data, children)
  }

  /**
   * 创建并返回一个文本型VNode实例
   * @param text 文本字符串
   * @private
   */
  _v(text: string) {
    return createTextVNode(text)
  }

  /**
   * 将值转成字符串。其中对象或数组将转成JSON字符串
   * @param text
   * @private
   */
  _s(text: any) {
    if(isUndef(text)) {
      return ''
    }

    if(Array.isArray(text) || isPlainObject(text)) {
      return JSON.stringify(text, null, 2)
    }

    return String(text)
  }
}
