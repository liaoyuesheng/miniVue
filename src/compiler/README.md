# 模板编译

将模板字符串编译成渲染函数的函数体字符串，Vue组件实例会调用`new Function()`生成最终的渲染函数。渲染函数可以根据数据生成新的虚拟DOM。

编译过程分为两步：

1. 将模板编译成AST
2. 将AST编译成函数体字符串

## 什么是AST?

全称Abstract Syntax Tree，即抽象语法树。简单来说是用来描述代码的对象。

本项目的AST特指描述的HTML代码的抽象语法树。例如下面代码所示：

HTML代码
```html
<div id="app" data-name="page">hi!</div>
```

对应的AST
```javascript
const ast = {
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

细心的朋友可能会发现，AST和VDOM非常像。没错，理论上，描述HTML的AST和VDOM是可以共用一个实现的。

## HTML怎么转换成AST？

大致原理是利用正则表达式分别匹配start标签（例如`<div id="app">`），end标签(例如`</div>`)，和文本内容。
并通过正则表达式中的分组把相关信息提取出来，比如start标签的标签名，属性，是否为自闭合标签；end标签的标签名；文本的内容。

在正则匹配开始前会新建一个栈对象（数组），每当匹配到start标签时，便按提取到的信息创建一个AST，如果栈末尾存在一个AST（这里称之为parentAST），
则把创建的AST添加到parentAST的子节点（即parentAST.children）中去。然后将新创建的这个AST push到栈末尾，成为新的parentAST
（因为start标签后的内容描述的是该标签的子节点）。

每当匹配到文本时，则根据文本内容创建一个AST，添加到AST的子节点中去，栈不做任何修改（因为文本是没有子节点的）。

每当匹配end标签时，则表示当前parentAST的子节点都已经匹配完成里，那么就从栈中pop出末尾的对象。

这样就将HTML转成了AST。

下面举个具体的例子，具体说明以下这个转换过程

需要转换的HTML
```html
<div id="app">
    <div class="title">我是标题</div>
    <div class="content">我是内容</div>
</div>
```

首先我们新建一个栈对象（stack），和一个根AST对象（astRoot，作为最终转成的AST）

```javascript
const stack = []
let astRoot
```

对于上述HTML，我们利用正则表达式首先会匹配到一个start标签`<div id="app">`，并获取信息："tag: 'div', attrs={id: 'app'}"，
然后我们根据这些信息创建一个AST：

```javascript
const ast = {
  tag: 'div',
  attrs: {
    id: 'app'
  },
  children: []
}
```

然后发现stack末尾没有对象，则把这个AST作为根AST。并向栈中推入这个AST。

接下来正则表达式会匹配到一个新的start标签`<div class="title">`，据此我们新建一个AST：

```javascript
const ast = {
  tag: 'div',
  attrs: {
    class: 'title'
  },
  children: []
}
```

我们把这个AST对象作为子节点添加到栈中最后一个AST（下称parentAST）中`parentAST.children.push(ast)`，并把这个AST push入stack中。

此时的`astRoot`是这样子：

```javascript
astRoot = {
  tag: 'div',
  attrs: {
    id: 'app'
  },
  children: [
    {
      tag: 'div',
      attrs: {
        class: 'title'
      },
      children: []
    }
  ]
}
```

此时stack是这样子： `[div#app, div.title]`

接下来会匹配到文本内容"我是标题"，创建一个文本型AST，添加到parentAST中。stack不做修改。

此时的`astRoot`是这样子：

```javascript
astRoot = {
  tag: 'div',
  attrs: {
    id: 'app'
  },
  children: [
    {
      tag: 'div',
      attrs: {
        class: 'title'
      },
      children: [
        {
          text: '我是标题'
        }
      ]
    }
  ]
}
```

此时stack是这样子： `[div#app, div.title]`

接下来会匹配到以个end标签`</div>`，说明当前的parentAST的子内容已经全部解析完。则把这个parentAST pop出来

此时astRoot没有变化

此时stack是这样子： `[div#app]`

接下来的以此类推，
会分别匹配到新的start标签`<div class="content">`，
匹配到文本内容"我是内容"，
匹配到end标签`</div>`，
在次匹配到end标签`</div>`，结束。

最终得到的astRoot长下面这个样子：

```javascript
astRoot = {
  tag: 'div',
  attrs: {
    id: 'app'
  },
  children: [
    {
      tag: 'div',
      attrs: {
        class: 'title'
      },
      children: [
        {
          text: '我是标题'
        }
      ]
    },
    {
      tag: 'div',
      attrs: {
        class: 'content'
      },
      children: [
        {
          text: '我是内容'
        }
      ]
    }
  ]
}
```

详细代码见[parser/index.ts](parser/index.ts)

## AST怎么转成渲染函数的函数体字符串

我们首先了解一下，这个渲染函数的函数体字符串长什么样子。举个例子：

```javascript
// 函数体字符串
const code = `width(this) {return _c('div', {attrs: {id: 'app'}},[_c('div', {staticClass: 'title'}, [_v('我是标题')]),_c('div', {staticClass: 'content'}, [_v('我是内容')])])}`

// 调用new Function('', code)转换后的渲染函数长下面这个样子
const render = function() {
  width(this)
  {
    return _c(
      'div',
      {
        attrs: {
          id: 'app'
        } 
      },
      [
       _c('div', {staticClass: 'title'}, [_v('我是标题')]),
       _c('div', {staticClass: 'content'}, [_v('我是内容')])
      ]
    ) 
  }
}
```

其中渲染函数被调用是会使用`call`方法把内部`this`指向对应的Vue组件实例，这样`_c()`和`_v()`就会调用到Vue组件实例的方法。
其中，`_c()`是创建元素型vnode（虚拟DOM实例）的方法，`_v()`是创建文本型vnode的方法。

那由AST转成对应的函数体字符串过程其实就很简单了，无非就是遍历整个AST，拿到对应的信息，
将当前AST节点拼接成字符串：'_c(...)'或'_v(...)'，按遍历顺序将这些字符串连接起来，就可以得到最终的结果了。

详情见[codegen/index.ts](codegen/index.ts)