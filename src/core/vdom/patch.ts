import VNode, {VNodeData} from './vnode'
import {isDef, isObject, isUndef} from '../../shared/util'

/**
 * 空节点
 */
export const emptyNode = new VNode('', {}, [])

/**
 * 对比新老虚拟DOM，找到有差异的节点，更新对应的真实DOM
 * @param oldVnode 老虚拟DOM，值也可以是真实DOM对象
 * @param vnode 新虚拟DOM
 */
export default function patch(oldVnode: VNode | Element, vnode: VNode) {
  // 如果oldVnode是一个真实DOM（比如vue实例初始化的时候）
  // 则根据vnode创建一颗真实的DOM树，在页面中替换掉原来的DOM
  if ((oldVnode as Element).nodeType) {
    const parentElm = (oldVnode as Element).parentNode as Element
    // 根据vnode创建DOM树，添加为parentElm的子节点
    createElm(vnode, parentElm, (oldVnode as Element).nextSibling as Element | Text)
    // 删除原来的真实DOM
    parentElm.removeChild(oldVnode as Element)
  } else {
    // 对比两个虚拟DOM
    patchVnode(oldVnode as VNode, vnode)
  }
}

/**
 * 根据vnode创建一颗真实的DOM树，保存为vnode.elm，并添加为元素parentElm的子节点
 * @param vnode 虚拟DOM
 * @param parentElm 目标父元素
 * @param refElm 基准元素，必须是parentElm的子节点，DOM树会插入到该元素前面的位置。
 *        如果参数缺省，则直接append到parentElm的末尾
 */
function createElm(vnode: VNode, parentElm: Element, refElm?: Element | Text) {
  // 如果vnode有tag值，说明他描述的是元素，则创建一个DOM元素并更新该元素的attributes
  if (vnode.tag) {
    vnode.elm = document.createElement(vnode.tag)
    updateProps(emptyNode, vnode)
    // 没有tag值，说明描述的是文本节点
  } else {
    // 创建文本节点
    vnode.elm = document.createTextNode(String(vnode.text))
  }
  // 如果有子节点，递归创建子节点对应的真实DOM节点
  if (vnode.children) {
    vnode.children.forEach((childVnode) => {
      createElm(childVnode, vnode.elm as Element)
    })
  }

  // 将创建的DOM树插入目标位置
  insert(parentElm, vnode.elm, refElm)
}

/**
 * 对比新老虚拟DOM，找到有差异的节点，更新对应的真实DOM
 * 方法默认oldVnode和vnode描述的是同一个真实DOM节点
 * @param oldVnode 老虚拟DOM
 * @param vnode 新虚拟DOM
 */
function patchVnode(oldVnode: VNode, vnode: VNode) {
  // 由于新vnode刚渲染出来elm属性是没有值的，所以patch时，vnode.elm = oldVnode.elm
  vnode.elm = oldVnode.elm
  // 如果vnode是元素节点
  if (vnode.tag) {
    // 对比更新对应真实DOM节点的attributes
    updateProps(oldVnode, vnode)

    // oldVnode的子节点集合
    const oldChildren = oldVnode.children || []
    // vnode的子节点集合
    const newChildren = vnode.children || []

    // 如果新老vnode都有子节点
    if (oldChildren.length > 0 && newChildren.length > 0) {
      // 则对比更新所有子节点
      updateChildren(vnode.elm as Element, oldChildren, newChildren)

      // 如果只有oldVnode有子节点
    } else if (oldChildren.length > 0 && newChildren.length === 0) {
      // 则删除老子节点（会删除对应描述的真实DOM节点）
      removeVnodes(oldChildren)

      // 如果只有vnode有子节点
    } else if (oldChildren.length === 0 && newChildren.length > 0) {
      // 则添加新的子节点（会创建对应描述的真实DOM节点）
      addVnodes(newChildren, vnode.elm as Element)
    }
    // 否则是文本节点
  } else {
    // 如果文本值不同
    if (oldVnode.text !== vnode.text) {
      // 则修改对应真实DOM节点的textContent
      vnode.elm.textContent = vnode.text
    }
  }
}

/**
 * 对比更新子节点(vnode)
 * @param parentElm 子节点所描述的真实DOM的真实父节点
 * @param oldChildren 老vnode的子节点集合
 * @param newChildren 新vnode的子节点集合
 */
function updateChildren(parentElm: Element, oldChildren: VNode[], newChildren: VNode[]) {
  let oldStartIndex = 0 // 待对比的老子节点的起点索引值
  let newStartIndex = 0 // 待对比的新子节点的起点索引值
  let oldEndIndex = oldChildren.length - 1 // 待对比的老子节点的终点索引值
  let newEndIndex = newChildren.length - 1 // 待对比的新子节点的终点索引值

  // 当起点索引值小于等于终点索引值时，说明待对比的节点数>0，继续对比
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    const oldStartVnode = oldChildren[oldStartIndex] // 待对比的老子节点的起点节点
    const newStartVnode = newChildren[newStartIndex] // 待对比的新子节点的起点节点
    const oldEndVnode = oldChildren[oldEndIndex] // 待对比的老子节点的终点节点
    const newEndVnode = newChildren[newEndIndex] // 待对比的新子节点的终点节点

    // 先比较新老起点节点，如果他们描述的是同一个真实DOM
    if (sameVnode(oldStartVnode, newStartVnode)) {
      // 则对比更新这两个节点（vnode）
      patchVnode(oldStartVnode, newStartVnode)
      // 新老起始索引都+1
      oldStartIndex++
      newStartIndex++
      continue
    }
    // 否则比较新老终点节点，如果他们描述的是同一个真实DOM
    if (sameVnode(oldEndVnode, newEndVnode)) {
      // 则对比更新这两个节点（vnode）
      patchVnode(oldEndVnode, newEndVnode)
      // 新老索引值都-1
      oldEndIndex--
      newEndIndex--
      continue
    }
    // 否则比较老起点节点和新终点节点，如果他们描述的是同一个真实DOM
    if (sameVnode(oldStartVnode, newEndVnode)) {
      // 则对比更新这两个节点（vnode）
      patchVnode(oldStartVnode, newEndVnode)
      // 把所描述的真实DOM节点挪到新vnode所描述的位置上。
      // 即老终点节点描述的真实DOM（oldEndVnode.elm）的后面，即oldEndVnode.elm.nextSibling的前面
      insert(parentElm, oldStartVnode.elm, oldEndVnode.elm.nextSibling as Element)
      // 老起点索引值+1
      oldStartIndex++
      // 新终点索引值-1
      newEndIndex--
      continue
    }
    // 否则比较老终点节点和新起点节点，如果他们描述的是同一个真实DOM
    if (sameVnode(oldEndVnode, newStartVnode)) {
      // 则对比更新这两个节点（vnode）
      patchVnode(oldEndVnode, newStartVnode)
      // 把所描述的真实DOM节点挪到新vnode所描述的位置上。即老起点节点描述的真实DOM（oldStartVnode.elm）的前面
      insert(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      // 老终点索引值-1
      oldEndIndex--
      // 新终点索引值+1
      newStartIndex++
      continue
    }

    // 如果上述4种对比方式都找不到描述相同真实DOM的节点，则遍历待对比新子节点，
    // 然后拿每一个遍历到的新子节点对比每一个待对比老子节点

    // 在待对比老子节点中，找出和新起点节点描述同一个真实DOM的老子节点的索引值
    const indexIndOld = findIndexInOld(newStartVnode, oldChildren, oldStartIndex, oldEndIndex + 1)
    // 如果找到了
    if (indexIndOld > -1) {
      // 则对比更新这两个节点（vnode）
      patchVnode(oldChildren[indexIndOld], newStartVnode)
      // 把所描述的真实DOM节点挪到新vnode所描述的位置上。即老起点节点描述的真实DOM（oldStartVnode.elm）的前面
      insert(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      // 把找到的老子节点从集合中删除
      oldChildren.splice(indexIndOld, 1)
      // 老终点索引值-1
      oldEndIndex--
      // 否则没找到
    } else {
      // 则根据新起点节点创建真实Dom树，添加到老起点节点描述的真实DOM的前面
      createElm(newStartVnode, parentElm, oldStartVnode.elm)
    }
    // 新起点索引值+1
    newStartIndex++
  }

  // 所有对比都结束后：
  // 如果老起点索引值>老终点索引值，说明老子节点全都对比成功（待对比老子节点数量为0）
  if (oldStartIndex > oldEndIndex) {
    // 则将剩下待对比的新子节点依次生成对应的真实DOM（如果待对比的新子节点数为0，说明都对比完了，下面的for循环也不会启动），
    // 生成的DOM插入位置为新终点节点的下一个节点（已对比过，elm属性值已经是一个真实DOM）描述的真实DOM的前面
    const refElm = newChildren[newEndIndex + 1] && newChildren[newEndIndex + 1].elm
    for (; newStartIndex <= newEndIndex; newStartIndex++) {
      createElm(newChildren[newStartIndex], parentElm, refElm)
    }
    // 否则如果新起点索引值>新终点索引值，说明新子节点全都对比成功，而老子节点还剩下一些未对比成功
  } else if (newStartIndex > newEndIndex) {
    // 则删除这些多余的老子节点描述的真实DOM
    removeVnodes(oldChildren, oldStartIndex, oldEndIndex + 1)
  }
}

/**
 * 在oldChildren中找出和vnode描述的是同一个真实DOM的节点的索引值
 * 找不到的情况下返回-1
 * @param vnode 对比的vnode
 * @param oldChildren 与vnode对比的节点集合
 * @param startIndex 查找的起始索引值（含）
 * @param endIndex 查找的结束索引值（不含）
 */
function findIndexInOld(vnode: VNode, oldChildren: VNode[], startIndex: number, endIndex: number) {
  if (startIndex >= endIndex) {
    return -1
  }
  // 遍历待查找的老子节点
  for (let index = startIndex; index < endIndex; index++) {
    // 如果当前老子节点与vnode描述的是同一个真实DOM， 返回当前索引值
    if (sameVnode(oldChildren[index], vnode)) {
      return index
    }
  }
  return -1
}

/**
 * 判断两个vnode描述的是否为同一个真实DOM
 */
function sameVnode(a: VNode, b: VNode) {
  return a.key === b.key && a.tag === b.tag
}

/**
 * 对比新老vnode，更新所描述的真实DOM的属性
 */
function updateProps(oldVnode: VNode, vnode: VNode) {
  // 更新除style和class以外的attributes
  updateAttrs(oldVnode, vnode)
  // 更新内联样式style
  updateStyle(oldVnode, vnode)
  // 更新CSS类名class
  updateClass(oldVnode, vnode)
}

/**
 * 对比新老vnode，更新所描述的真实DOM除style和class以外的属性
 */
function updateAttrs(oldVnode: VNode, vnode: VNode) {
  // 老attrs
  let oldAttrs = oldVnode.data && oldVnode.data.attrs
  // 新attrs
  let newAttrs = vnode.data && vnode.data.attrs

  // 如果两个节点都不含attr属性则跳过更新
  if (!oldAttrs && !newAttrs) {
    return
  }

  oldAttrs = oldAttrs || {}
  newAttrs = newAttrs || {}

  // 真实DOM元素
  const elm = vnode.elm as Element

  // 遍历老attrs
  Object.keys(oldAttrs).forEach((key) => {
    // 如果新attrs中没有这个属性，则删除DOM的这个属性
    if (isUndef(newAttrs[key])) {
      elm.removeAttribute(key)
    }
  })

  // 遍历新attrs
  Object.keys(newAttrs).forEach((key) => {
    // 如果老属性值不等于新属性值，则用新属性值更新DOM
    if (oldAttrs[key] !== newAttrs[key]) {
      elm.setAttribute(key, newAttrs[key])
    }
  })
}

/**
 * 对比新老vnode，更新所描述的真实DOM的内联样式style
 */
function updateStyle(oldVnode: VNode, vnode: VNode) {
  const oldData = oldVnode.data || {} as VNodeData
  const data = vnode.data || {} as VNodeData

  if (
    !oldData.staticStyle && !oldData.style &&
    !data.staticStyle && !data.style
  ) {
    return
  }

  // 老样式=老静态样式与老动态样式合并（动态样式是v-bind:style="{}"这种方式绑定的样式最终计算的结果）
  const oldStyle = Object.assign({}, oldData.staticStyle || {}, oldData.style || {})
  // 新样式=新静态样式与新动态样式合并
  const newStyle = Object.assign({}, data.staticStyle || {}, data.style || {})
  // 真实DOM
  const elm = vnode.elm as HTMLElement

  // 遍历老样式
  Object.keys(oldStyle).forEach((name) => {
    // 如果新样式中没有这个样式，则删除DOM的这个样式
    if (!newStyle[name]) {
      if (isDef(elm.style[name])) {
        elm.style[name] = ''
      }
    }
  })

  // 遍历新样式
  Object.keys(newStyle).forEach((name) => {
    const newStyleVal = newStyle[name]
    // 如果当前老样式和新样式不同，则用新样式值更新这个DOM
    if (oldStyle[name] !== newStyleVal) {
      if (isDef(elm.style[name])) {
        elm.style[name] = newStyleVal
      }
    }
  })
}

/**
 * 对比新老vnode，更新所描述的真实DOM的CSS类名class
 * 与updateStyle()方法一个一个修改不同，这里方法的实现是直接将新的class字符串整个赋值给class属性
 */
function updateClass(oldVnode: VNode, vnode: VNode) {
  const oldData = oldVnode.data || {}
  const data = vnode.data || {}

  // 如果这连个节点都没有staticClass或class则跳过更新
  if (
    !oldData.staticClass && !oldData.class &&
    !data.staticClass && !data.class
  ) {
    return
  }

  /**
   * 把class字符串转化为class数组。例如："title title-large" => ["title","title-large"]
   */
  const classStr2Arr = (string: string) => {
    return string.trim().split(/\s+/)
  }
  // 新动态class
  let newClass = data.class
  // class最终值列表（暂时等于静态class列表，后续会添加新的值进来）
  const classList = data.staticClass ? (classStr2Arr(data.staticClass)) : []

  // 如果新动态class是字符串，则将它转成数组
  if (typeof newClass === 'string') {
    newClass = classStr2Arr(newClass)
  }
  // 如果新动态class是数组
  if (Array.isArray(newClass)) {
    // 则遍历数组，不重复地将单个class添加进列表
    newClass.forEach((className) => {
      if (!classList[className]) {
        classList.push(className)
      }
    })
    // 否则如果新动态class是对象
  } else if (isObject(newClass)) {
    // 则遍历对象，不重复地将单个class添加进列表
    Object.keys(newClass).forEach((className) => {
      if (newClass[className] && !classList[className]) {
        classList.push(className)
      }
    })
  }
  // class最终值（字符串）
  const classString = classList.join(' ');
  // 覆写真实DOM的class属性
  (vnode.elm as HTMLElement).setAttribute('class', classString)
}

/**
 * 在基准节点前插入一个节点，如果基准节点不存在，则将要插入的节点添加到父节点内的末尾
 * @param parentElm 父节点
 * @param elm 要插入的节点
 * @param ref 基准节点
 */
function insert(parentElm: Element, elm: Element | Text, ref: Element | Text) {
  if (ref) {
    parentElm.insertBefore(elm, ref)
  } else {
    parentElm.appendChild(elm)
  }
}

/**
 * 根据所给定的起点和终点，依次为节点集合中的每一个节点创建真实DOM
 * @param vnodes 节点集合
 * @param parentElm 父节点
 * @param refElm 基准节点
 * @param start 起点
 * @param end 终点
 */
function addVnodes(vnodes: VNode[], parentElm: Element, refElm?: Element | Text, start = 0, end = vnodes.length) {
  for (let index = start; index < end; index++) {
    createElm(vnodes[index], parentElm, refElm)
  }
}

/**
 * 根据所给定的起点和终点，依次删除节点集合中的每一个节点所描述的真实DOM
 * @param vnodes
 * @param start
 * @param end
 */
function removeVnodes(vnodes: VNode[], start = 0, end = vnodes.length) {
  for (let index = start; index < end; index++) {
    const vnode = vnodes[index]
    if (!vnode) {
      continue
    }

    const elm = vnode.elm
    if (!elm) {
      continue
    }

    const parent = elm.parentNode
    if (!parent) {
      continue
    }

    parent.removeChild(elm)
  }
}
