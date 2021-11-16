# 虚拟DOM

## 什么是虚拟DOM

虚拟DOM就是描述真实DOM的JavaScript对象。例如下面代码所示：

真实DOM
```html
<div id="app" data-name="page">hi!</div>
```

对应的虚拟DOM
```javascript
const vnode = {
  tag: 'div',
  attrs: {
    id: 'app',
    'data-name': 'page'
  },
  children: [
    {
      text: 'hi!'
    }
  ]
}
```

## 本项目采用的虚拟DOM

详见[vnode.ts](vnode.ts)

```typescript
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
```

为与Vue源码保持一致，我们也用一个VNode类来实现虚拟DOM（也可以用普通对象来实现），详情见[vnode.ts](vnode.ts)。

为了简单起见，本项目把vnode仅分为两类，即元素节点和文本节点。

当tag有值时，为元素节点。当tag无值时，为文本节点，此时text为文本内容。

## DOM-Diff

DOM-Diff的过程中，会先调用`patch()`方法将最新的vnode和老的vnode进行差异比较，发现差异后对应的修改视图（即修改页面中的真实DOM）

patch的时候分为两种情况：

1. 没有老vnode的时候（比如Vue初次实例化，第一次渲染视图时）。此时会直接根据新vnode的描述创建一颗真实的DOM节点树，然后添加进页面里。
2. 有老vnode的时候。此时调用`patchVnode()`对比新老vnode。

### patchVnode()

当对新老vnode进行patchVnode时，默认这两个vnode所描述的真实DOM是同一个对象。

如果新老vnode是文本节点，则更新对应真实DOM的文本内容。

如果新老vnode是元素节点，则找出这两个新老vnode的attributes的差异，然后更新对应的真实DOM。

这样当前节点对应的真实DOM就完成了更新，接下来调用对比新老vnode的子节点。

对比新老vnode的子节点时，会出现以下几种情况：

1. 新老vnode都有子节点，调用`updateChildren()`对比子节点，更新真实DOM；
2. 只有老vnode有子节点，那就删除对应真实DOM的所有子DOM节点；
3. 只有新vnode有子节点，那就根据新vnode的描述创建新的DOM节点，作为子DOM节点插入到对应真实DOM中去。

### updateChildren()

该方法会对两组子vnode节点进行一一对比，找出描述的是同一个真实DOM的一对vnode，
然后把对应真实DOM的位置以新vnode为准移动，然后调用`patchVnode()`去更新对应的真实DOM。

对比中，对未匹配的老子vnode，删除其对应的真实DOM（新vnode没有，说明对应真实DOM需要删除）；对未匹配的新子vnode，根据新vnode的描述，创建新的DOM节点，作为子DOM节点插入到对应真实DOM中去。

这样，通过`patchVnode()`和`updateChildren()`来回调用，则可以递归找出新老虚拟DOM树的差异，更新页面中对应的真实DOM

详情见文件[patch.ts](patch.ts)
