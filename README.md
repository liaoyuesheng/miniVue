# miniVue

简化版的Vue（基于vue2.0），使用TypeScript书写，包含详细的注释，帮助读者阅读和学习Vue的源码

有任何疑问或发现任何错误欢迎在Issues中提出来

## 使用

将项目下载到本地，在项目根目录运行 `npm i` 或 `yarn` 安装项目。

然后运行`npm run dev`启动项目。浏览器会自动打开调试页面。

你可以随时编辑源码。例如在"/src/compiler/index.ts"文件插入`console.log(ast)`打印AST对象，然后在调试页面控制台观察当前模板生成的AST对象究竟是什么样子的。

\* 值得注意的是，在浏览器控制台打印出来的对象，在你查看它时，看到它的属性值即时的（已查看过的对象属性值会保持不变），而不是它被打印时的样子。
例如打印一个刚被创建的vnode对象，此时vnode.elm=undefined，但是当你在浏览器控制台展开查看这个vnode对象时，会发现vnode.elm已经有值了。
因为当你在控制台查看时，vnode对象已经被修改过，你看到的是vnode最新的即时的状态。
所以，如果你想查看看vnode.elm在打印时是什么值，请打印`console.log(vnode.elm)`而不是`console.log(vnode)`

## Vue原理浅述

学习源码，最好先了解其实现的原理。了解它分为哪些部分，每部分干了什么事（实现了什么功能），然后再去看具体的代码，看它如何具体实现某一个功能（先知道要做什么，在去了解如何做）。
而不是直接去看具体的代码，因为此时你不但要分析它如何实现某个功能，还要猜测当前代码具体要实现的功能是什么，必会事倍功半。

所以这里我简单介绍一下Vue的原理

一个Vue应用是由若干个Vue组件组成的（new Vue()生成的根实例可以理解为根组件）
每个组件都有它负责更新的视图，也就是页面中具体的DOM节点。
另外，每一个组件对应的会有一个vnode（虚拟DOM），一个渲染函数（用来生成最新的vnode），一个watcher（当和组件相关的数据发生变化时，它会收到通知，并调用组件的相关方法创建新的vnode，并对比新老vnode的差异，依此更新视图），

现在我们知道，一个组件实例要有一个vnode，一个render，一个watcher，才能更新视图。那么有以下几个疑问：

1. vnode（虚拟DOM）是什么，vnode如何更新视图？
2. render怎么生成的？
3. watcher怎么知道相关数据发生了变化？

解决以上问题就可以实现一个简易版本的Vue

关于第1点问题，详见文件[src/core/vdom/README.md](src/core/vdom/README.md)

关于第2点问题，详见文件[src/compiler/README.md](src/compiler/README.md)

关于第3点问题，请先参考官方的解释：[深入响应式原理](https://cn.vuejs.org/v2/guide/reactivity.html)，
然后详见文件[src/core/observer/README.md](src/core/observer/README.md)

### 小结

Vue应用初始化过程：
```
├─把data转成可观察对象（遍历data所有property，转成getter/setter，创建dep）
└─初始化组件
   ├─模版 ==编译==> AST ==编译==> render（渲染函数）
   ├─创建wacther
   └─调用render ==渲染==> VDOM（虚拟DOM）==DOM-Diff(patch)==> 视图（真实DOM）
                  │
              触碰getter
                  │
             dep收集watcher
```

Vue应用数据变化更新视图过程：
```
├─data属性写值
├─触发setter
├─对应dep通知相关watcher
└─watcher调用render ==渲染==> VDOM（虚拟DOM）==DOM-Diff(patch)==> 视图（真实DOM）
```

## 项目文件结构

下面所示结构为本项目结构，与Vue源码的文件结构不尽相同

```
├─dist                  # 构建后文件
├─docs                  # 调试页面
└─src                   # 源代码
    ├─complier          # 负责将模板编译成虚拟DOM
    ├─core              # 核心代码
    │  ├─instance       # 创建Vue类
    │  ├─observe        # 实现响应式系统
    │  └─vdom           # 实现虚拟DOM
    └─shared            # 公用工具
    
```

## 版本说明

### 1.0.0

miniVue是精简版的Vue，功能上砍去了大量的枝叶，仅保留了最基本的功能，这样我们可以更快更容易的学习Vue的源码基本原理。

在之后的升级中，会慢慢完善miniVue的功能。读者可以参考升级日志，然后通过版本对比去了解，新增某个功能增加和修改了哪些代码。

下面对1.0.0版本的miniVue做个描述：

 * Options仅支持`el`，`data`，`template`和`render`；
 * 指令仅支持`v-bind`和`v-cloak`；
 * 暂不支持数组更新检测（data中的数组调用变更方法不会触发视图更新）；
 * 暂不支持组件；
 * 暂无全局API；
 * 暂无生命周期钩子等等。

### 1.2.0
 * 修复若干bug；
 * 新增对数组更新检测的支持。