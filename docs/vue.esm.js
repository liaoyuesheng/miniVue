/**
 * 虚拟dom
 * 用来描述真实dom节点的对象（这里用类来实现，可以用普通对象+函数的方法实现）
 */
class VNode {
    constructor(tag, data, children, text, elm) {
        this.tag = tag;
        this.data = data;
        this.children = children;
        this.text = text;
        this.elm = elm;
    }
}
/**
 * 创建并返回一个元素型VNode实例（虚拟DOM）
 * @param tag 标签名
 * @param data 描述元素的properties的相关数据
 * @param children 子元素集合
 * @private
 */
function createElementVNode(tag, data, children) {
    if (children) {
        children = children.map((child) => {
            if (typeof child === 'string') {
                return createTextVNode(child);
            }
            else {
                return child;
            }
        });
    }
    return new VNode(tag, data, children);
}
/**
 * 创建并返回一个文本型VNode实例
 * @param text 文本字符串
 * @private
 */
function createTextVNode(text) {
    return new VNode(undefined, undefined, undefined, text);
}

/**
 * 是否未定义
 */
function isUndef(v) {
    return v === undefined || v === null;
}
/**
 * 是否已定义
 */
function isDef(v) {
    return v !== undefined && v !== null;
}
/**
 * 是否为对象
 */
function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
/**
 * 空函数
 */
function noop() { }
/**
 * 为纯函数创建一个具备缓存版本的函数
 */
function cached(fn) {
    const cache = Object.create(null);
    return function cachedFn(str) {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
    };
}
/**
 * 将分割符连接的字符串转换成驼峰式
 */
const camelizeRE = /-(\w)/g;
const camelize = cached((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '');
});

/**
 * 空节点
 */
const emptyNode = new VNode('', {}, []);
/**
 * 对比新老虚拟DOM，找到有差异的节点，更新对应的真实DOM
 * @param oldVnode 老虚拟DOM，值也可以是真实DOM对象
 * @param vnode 新虚拟DOM
 */
function patch(oldVnode, vnode) {
    // 如果oldVnode是一个真实DOM（比如vue实例初始化的时候）
    // 则根据vnode创建一颗真实的DOM树，在页面中替换掉原来的DOM
    if (oldVnode.nodeType) {
        const parentElm = oldVnode.parentNode;
        // 根据vnode创建DOM树，添加为parentElm的子节点
        createElm(vnode, parentElm, oldVnode.nextSibling);
        // 删除原来的真实DOM
        parentElm.removeChild(oldVnode);
    }
    else {
        // 对比两个虚拟DOM
        patchVnode(oldVnode, vnode);
    }
}
/**
 * 根据vnode创建一颗真实的DOM树，保存为vnode.elm，并添加为元素parentElm的子节点
 * @param vnode 虚拟DOM
 * @param parentElm 目标父元素
 * @param refElm 基准元素，必须是parentElm的子节点，DOM树会插入到该元素前面的位置。
 *        如果参数缺省，则直接append到parentElm的末尾
 */
function createElm(vnode, parentElm, refElm) {
    // 如果vnode有tag值，说明他描述的是元素，则创建一个DOM元素并更新该元素的attributes
    if (vnode.tag) {
        vnode.elm = document.createElement(vnode.tag);
        updateProps(emptyNode, vnode);
        // 没有tag值，说明描述的是文本节点
    }
    else {
        // 创建文本节点
        vnode.elm = document.createTextNode(String(vnode.text));
    }
    // 如果有子节点，递归创建子节点对应的真实DOM节点
    if (vnode.children) {
        vnode.children.forEach((childVnode) => {
            createElm(childVnode, vnode.elm);
        });
    }
    // 将创建的DOM树插入目标位置
    insert(parentElm, vnode.elm, refElm);
}
/**
 * 对比新老虚拟DOM，找到有差异的节点，更新对应的真实DOM
 * 方法默认oldVnode和vnode描述的是同一个真实DOM节点
 * @param oldVnode 老虚拟DOM
 * @param vnode 新虚拟DOM
 */
function patchVnode(oldVnode, vnode) {
    // 由于新vnode刚渲染出来elm属性是没有值的，所以patch时，vnode.elm = oldVnode.elm
    vnode.elm = oldVnode.elm;
    // 如果vnode是元素节点
    if (vnode.tag) {
        // 对比更新对应真实DOM节点的attributes
        updateProps(oldVnode, vnode);
        // oldVnode的子节点集合
        const oldChildren = oldVnode.children || [];
        // vnode的子节点集合
        const newChildren = vnode.children || [];
        // 如果新老vnode都有子节点
        if (oldChildren.length > 0 && newChildren.length > 0) {
            // 则对比更新所有子节点
            updateChildren(vnode.elm, oldChildren, newChildren);
            // 如果只有oldVnode有子节点
        }
        else if (oldChildren.length > 0 && newChildren.length === 0) {
            // 则删除老子节点（会删除对应描述的真实DOM节点）
            removeVnodes(oldChildren);
            // 如果只有vnode有子节点
        }
        else if (oldChildren.length === 0 && newChildren.length > 0) {
            // 则添加新的子节点（会创建对应描述的真实DOM节点）
            addVnodes(newChildren, vnode.elm);
        }
        // 否则是文本节点
    }
    else {
        // 如果文本值不同
        if (oldVnode.text !== vnode.text) {
            // 则修改对应真实DOM节点的textContent
            vnode.elm.textContent = vnode.text;
        }
    }
}
/**
 * 对比更新子节点(vnode)
 * @param parentElm 子节点所描述的真实DOM的真实父节点
 * @param oldChildren 老vnode的子节点集合
 * @param newChildren 新vnode的子节点集合
 */
function updateChildren(parentElm, oldChildren, newChildren) {
    let oldStartIndex = 0; // 待对比的老子节点的起点索引值
    let newStartIndex = 0; // 待对比的新子节点的起点索引值
    let oldEndIndex = oldChildren.length - 1; // 待对比的老子节点的终点索引值
    let newEndIndex = newChildren.length - 1; // 待对比的新子节点的终点索引值
    // 当起点索引值小于等于终点索引值时，说明待对比的节点数>0，继续对比
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        const oldStartVnode = oldChildren[oldStartIndex]; // 待对比的老子节点的起点节点
        const newStartVnode = newChildren[newStartIndex]; // 待对比的新子节点的起点节点
        const oldEndVnode = oldChildren[oldEndIndex]; // 待对比的老子节点的终点节点
        const newEndVnode = newChildren[newEndIndex]; // 待对比的新子节点的终点节点
        // 先比较新老起点节点，如果他们描述的是同一个真实DOM
        if (sameVnode(oldStartVnode, newStartVnode)) {
            // 则对比更新这两个节点（vnode）
            patchVnode(oldStartVnode, newStartVnode);
            // 新老起始索引都+1
            oldStartIndex++;
            newStartIndex++;
            continue;
        }
        // 否则比较新老终点节点，如果他们描述的是同一个真实DOM
        if (sameVnode(oldEndVnode, newEndVnode)) {
            // 则对比更新这两个节点（vnode）
            patchVnode(oldEndVnode, newEndVnode);
            // 新老索引值都-1
            oldEndIndex--;
            newEndIndex--;
            continue;
        }
        // 否则比较老起点节点和新终点节点，如果他们描述的是同一个真实DOM
        if (sameVnode(oldStartVnode, newEndVnode)) {
            // 则对比更新这两个节点（vnode）
            patchVnode(oldStartVnode, newEndVnode);
            // 把所描述的真实DOM节点挪到新vnode所描述的位置上。
            // 即老终点节点描述的真实DOM（oldEndVnode.elm）的后面，即oldEndVnode.elm.nextSibling的前面
            insert(parentElm, oldStartVnode.elm, oldEndVnode.elm.nextSibling);
            // 老起点索引值+1
            oldStartIndex++;
            // 新终点索引值-1
            newEndIndex--;
            continue;
        }
        // 否则比较老终点节点和新起点节点，如果他们描述的是同一个真实DOM
        if (sameVnode(oldEndVnode, newStartVnode)) {
            // 则对比更新这两个节点（vnode）
            patchVnode(oldEndVnode, newStartVnode);
            // 把所描述的真实DOM节点挪到新vnode所描述的位置上。即老起点节点描述的真实DOM（oldStartVnode.elm）的前面
            insert(parentElm, oldEndVnode.elm, oldStartVnode.elm);
            // 老终点索引值-1
            oldEndIndex--;
            // 新终点索引值+1
            newStartIndex++;
            continue;
        }
        // 如果上述4种对比方式都找不到描述相同真实DOM的节点，则遍历待对比新子节点，
        // 然后拿每一个遍历到的新子节点对比每一个待对比老子节点
        // 在待对比老子节点中，找出和新起点节点描述同一个真实DOM的老子节点的索引值
        const indexIndOld = findIndexInOld(newStartVnode, oldChildren, oldStartIndex, oldEndIndex + 1);
        // 如果找到了
        if (indexIndOld > -1) {
            // 则对比更新这两个节点（vnode）
            patchVnode(oldChildren[indexIndOld], newStartVnode);
            // 把所描述的真实DOM节点挪到新vnode所描述的位置上。即老起点节点描述的真实DOM（oldStartVnode.elm）的前面
            insert(parentElm, oldEndVnode.elm, oldStartVnode.elm);
            // 把找到的老子节点从集合中删除
            oldChildren.splice(indexIndOld, 1);
            // 老终点索引值-1
            oldEndIndex--;
            // 否则没找到
        }
        else {
            // 则根据新起点节点创建真实Dom树，添加到老起点节点描述的真实DOM的前面
            createElm(newStartVnode, parentElm, oldStartVnode.elm);
        }
        // 新起点索引值+1
        newStartIndex++;
    }
    // 所有对比都结束后：
    // 如果老起点索引值>老终点索引值，说明老子节点全都对比成功（待对比老子节点数量为0）
    if (oldStartIndex > oldEndIndex) {
        // 则将剩下待对比的新子节点依次生成对应的真实DOM（如果待对比的新子节点数为0，说明都对比完了，下面的for循环也不会启动），
        // 生成的DOM插入位置为新终点节点的下一个节点（已对比过，elm属性值已经是一个真实DOM）描述的真实DOM的前面
        const refElm = newChildren[newEndIndex + 1] && newChildren[newEndIndex + 1].elm;
        for (; newStartIndex <= newEndIndex; newStartIndex++) {
            createElm(newChildren[newStartIndex], parentElm, refElm);
        }
        // 否则如果新起点索引值>新终点索引值，说明新子节点全都对比成功，而老子节点还剩下一些未对比成功
    }
    else if (newStartIndex > newEndIndex) {
        // 则删除这些多余的老子节点描述的真实DOM
        removeVnodes(oldChildren, oldStartIndex, oldEndIndex + 1);
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
function findIndexInOld(vnode, oldChildren, startIndex, endIndex) {
    if (startIndex >= endIndex) {
        return -1;
    }
    // 遍历待查找的老子节点
    for (let index = startIndex; index < endIndex; index++) {
        // 如果当前老子节点与vnode描述的是同一个真实DOM， 返回当前索引值
        if (sameVnode(oldChildren[index], vnode)) {
            return index;
        }
    }
    return -1;
}
/**
 * 判断两个vnode描述的是否为同一个真实DOM
 */
function sameVnode(a, b) {
    return a.key === b.key && a.tag === b.tag;
}
/**
 * 对比新老vnode，更新所描述的真实DOM的属性
 */
function updateProps(oldVnode, vnode) {
    // 更新除style和class以外的attributes
    updateAttrs(oldVnode, vnode);
    // 更新内联样式style
    updateStyle(oldVnode, vnode);
    // 更新CSS类名class
    updateClass(oldVnode, vnode);
}
/**
 * 对比新老vnode，更新所描述的真实DOM除style和class以外的属性
 */
function updateAttrs(oldVnode, vnode) {
    // 老attrs
    let oldAttrs = oldVnode.data && oldVnode.data.attrs;
    // 新attrs
    let newAttrs = vnode.data && vnode.data.attrs;
    // 如果两个节点都不含attr属性则跳过更新
    if (!oldAttrs && !newAttrs) {
        return;
    }
    oldAttrs = oldAttrs || {};
    newAttrs = newAttrs || {};
    // 真实DOM元素
    const elm = vnode.elm;
    // 遍历老attrs
    Object.keys(oldAttrs).forEach((key) => {
        // 如果新attrs中没有这个属性，则删除DOM的这个属性
        if (isUndef(newAttrs[key])) {
            elm.removeAttribute(key);
        }
    });
    // 遍历新attrs
    Object.keys(newAttrs).forEach((key) => {
        // 如果老属性值不等于新属性值，则用新属性值更新DOM
        if (oldAttrs[key] !== newAttrs[key]) {
            elm.setAttribute(key, newAttrs[key]);
        }
    });
}
/**
 * 对比新老vnode，更新所描述的真实DOM的内联样式style
 */
function updateStyle(oldVnode, vnode) {
    const oldData = oldVnode.data || {};
    const data = vnode.data || {};
    if (!oldData.staticStyle && !oldData.style &&
        !data.staticStyle && !data.style) {
        return;
    }
    // 老样式=老静态样式与老动态样式合并（动态样式是v-bind:style="{}"这种方式绑定的样式最终计算的结果）
    const oldStyle = Object.assign({}, oldData.staticStyle || {}, oldData.style || {});
    // 新样式=新静态样式与新动态样式合并
    const newStyle = Object.assign({}, data.staticStyle || {}, data.style || {});
    // 真实DOM
    const elm = vnode.elm;
    // 遍历老样式
    Object.keys(oldStyle).forEach((name) => {
        // 如果新样式中没有这个样式，则删除DOM的这个样式
        if (!newStyle[name]) {
            if (isDef(elm.style[name])) {
                elm.style[name] = '';
            }
        }
    });
    // 遍历新样式
    Object.keys(newStyle).forEach((name) => {
        const newStyleVal = newStyle[name];
        // 如果当前老样式和新样式不同，则用新样式值更新这个DOM
        if (oldStyle[name] !== newStyleVal) {
            if (isDef(elm.style[name])) {
                elm.style[name] = newStyleVal;
            }
        }
    });
}
/**
 * 对比新老vnode，更新所描述的真实DOM的CSS类名class
 * 与updateStyle()方法一个一个修改不同，这里方法的实现是直接将新的class字符串整个赋值给class属性
 */
function updateClass(oldVnode, vnode) {
    const oldData = oldVnode.data || {};
    const data = vnode.data || {};
    // 如果这连个节点都没有staticClass或class则跳过更新
    if (!oldData.staticClass && !oldData.class &&
        !data.staticClass && !data.class) {
        return;
    }
    /**
     * 把class字符串转化为class数组。例如："title title-large" => ["title","title-large"]
     */
    const classStr2Arr = (string) => {
        return string.trim().split(/\s+/);
    };
    // 新动态class
    let newClass = data.class;
    // class最终值列表（暂时等于静态class列表，后续会添加新的值进来）
    const classList = data.staticClass ? (classStr2Arr(data.staticClass)) : [];
    // 如果新动态class是字符串，则将它转成数组
    if (typeof newClass === 'string') {
        newClass = classStr2Arr(newClass);
    }
    // 如果新动态class是数组
    if (Array.isArray(newClass)) {
        // 则遍历数组，不重复地将单个class添加进列表
        newClass.forEach((className) => {
            if (!classList[className]) {
                classList.push(className);
            }
        });
        // 否则如果新动态class是对象
    }
    else if (isObject(newClass)) {
        // 则遍历对象，不重复地将单个class添加进列表
        Object.keys(newClass).forEach((className) => {
            if (newClass[className] && !classList[className]) {
                classList.push(className);
            }
        });
    }
    // class最终值（字符串）
    const classString = classList.join(' ');
    // 覆写真实DOM的class属性
    vnode.elm.setAttribute('class', classString);
}
/**
 * 在基准节点前插入一个节点，如果基准节点不存在，则将要插入的节点添加到父节点内的末尾
 * @param parentElm 父节点
 * @param elm 要插入的节点
 * @param ref 基准节点
 */
function insert(parentElm, elm, ref) {
    if (ref) {
        parentElm.insertBefore(elm, ref);
    }
    else {
        parentElm.appendChild(elm);
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
function addVnodes(vnodes, parentElm, refElm, start = 0, end = vnodes.length) {
    for (let index = start; index < end; index++) {
        createElm(vnodes[index], parentElm, refElm);
    }
}
/**
 * 根据所给定的起点和终点，依次删除节点集合中的每一个节点所描述的真实DOM
 * @param vnodes
 * @param start
 * @param end
 */
function removeVnodes(vnodes, start = 0, end = vnodes.length) {
    for (let index = start; index < end; index++) {
        const vnode = vnodes[index];
        if (!vnode) {
            continue;
        }
        const elm = vnode.elm;
        if (!elm) {
            continue;
        }
        const parent = elm.parentNode;
        if (!parent) {
            continue;
        }
        parent.removeChild(elm);
    }
}

/**
 * 依赖管理器（采用的设计模式是观察者模式）
 * 用来收集依赖和通知依赖
 * 在本项目，"依赖"是Watcher实例
 * 一个响应式属性对应生成一个dep
 */
class Dep {
    constructor() {
        // 保存依赖的数组
        this.subs = [];
    }
    // 订阅（添加依赖）
    addSub(sub) {
        this.subs.push(sub);
    }
    // 删除订阅（删除依赖）
    removeSub(sub) {
        const index = this.subs.indexOf(sub);
        if (index > -1) {
            this.subs.splice(index, 1);
        }
    }
    // 收集保存在Dep.target上的依赖
    depend() {
        // Dep.target存在，且不再subs中才会被收集，避免重复收集
        if (Dep.target && !this.subs.includes(Dep.target)) {
            this.addSub((Dep.target));
        }
    }
    // 发布通知
    notify() {
        // 调用所有的依赖的update()方法
        this.subs.forEach((sub) => {
            sub.update();
        });
    }
}
// 用来临时存放需要被收集的依赖的静态属性
Dep.target = null;

/**
 * 将目标对象转化成被观察对象
 * 遍历对象的属性，把每个属性用Object.defineProperty方法转换成getter/setter
 * 通过getter/setter收集依赖和发送通知
 */
class Observer {
    constructor(obj) {
        // 通过定义不可遍历的属性'__ob__'， 将实例附加到目标对象上。已附加的对象则表示已经转化过了
        def(obj, '__ob__', this);
        this.walk(obj);
    }
    /**
     *  遍历目标对象的所有属性，将属性转换成getter/setter
     */
    walk(obj) {
        const keys = Object.keys(obj);
        keys.forEach((key) => {
            defineReactive(obj, key);
        });
    }
}
/**
 * 将未转化的对象调用Observer将其转化
 */
function observe(obj) {
    // 如果不是对象则不处理
    if (typeof obj !== 'object') {
        return;
    }
    // 已转化的，返回对应的Observe实例，未转化的调用Observer将其转化
    return obj['__ob__'] || new Observer(obj);
}
/**
 * 转换对象属性为getter/setter
 * 如果对象属性值是对象，则同时转化这个对象为被观察对象
 * （通过这样循环调用，可以递归转化所有后代对象属性为getter/setter）
 * 为这个对象属性创建一个dep(依赖管理器)
 * 当相关依赖（即会读取这个属性值的依赖）触碰这个属性（读取值）时，会触发getter，此时dep收集这个依赖
 * 当这个对象属性写值时，会触发setter，此时dep会通知所有收集来的依赖：值变了，你去把对应的视图更新了
 */
function defineReactive(obj, key) {
    let val = obj[key];
    // 方法内部会判断，如果对象属性对应的值是对象，则转化这个对象为被观察对象
    observe(val);
    // 为这个对象属性创建一个dep(依赖管理器)
    const dep = new Dep();
    // 转换对象属性为getter/setter
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get() {
            // 依赖触碰这个getter前会将依赖放在Dep.target上。所以如果Dep.target存在，则收集这个依赖
            if (Dep.target) {
                // 收集依赖
                dep.depend();
            }
            return val;
        },
        set(newVal) {
            if (newVal === val) {
                return;
            }
            val = newVal;
            // 重新写值后，需要重新把后代属性都转成被观察对象
            observe(val);
            // 值发生变化，通知依赖
            dep.notify();
        },
    });
}
/**
 * 定义一个属性（主要用来定义一个不可遍历的属性）
 */
function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true,
    });
}

/**
 * 一个watcher实例对应一个vue组件。
 * 当触碰getter时，watcher会被收集到对应的dep中。
 * 对应的dep是指这个vue组件视图会用到的属性所创建的dep，
 * 比如这个组件会用到:data.title和data.content这两个属性，那么这两个属性创建的dep都会收集这个watcher，
 * 当这两个属性值发生变化时，对应的dep就会通知他的watcher更新视图
 * 关于dep详见"./dep.ts"
 */
class Watcher {
    constructor(fn = noop) {
        this.getter = fn;
        this.get();
    }
    /**
     * 更新视图
     */
    get() {
        // 将这个watcher保存在Dep.target上，方便对应的dep收集这个watcher
        Dep.target = this;
        // 更新视图。更新视图的时候会触碰data的getter/setter，使对应的dep收集这个watcher
        this.getter();
        Dep.target = null;
    }
    /**
     * 更新的真正方法
     * 在queueWatcher()方法中被调用
     */
    run() {
        this.get();
    }
    /**
     * 更新
     * 同一个watcher在一个JS执行队列中多次调用update()，只会在下一个JS执行队列中执行一次run()
     * 以此实现数据连续多次修改合并到一起更新一次视图
     */
    update() {
        queueWatcher(this);
    }
}
// 用来需要在下一个JS队列更新的watcher，同一个watcher只会被push一次
const queue = [];
// true表示正在等待下一个JS执行队列
let waiting = false;
/**
 * 将多个watcher放在下一个JS执行队列一起更新，同一个watcher只会被更新一次
 */
function queueWatcher(watcher) {
    // 如果没有在等待下一个JS执行队列，则调用nextTick来创建异步执行队列
    if (!waiting) {
        waiting = true;
        nextTick().then(() => {
            // 已进入"下一个JS执行队列"，将waiting置为false
            waiting = false;
            // 执行所有watcher的run()方法
            queue.forEach((watcher) => {
                watcher.run();
            });
            // 清空watcher队列
            queue.splice(0, queue.length);
        });
    }
    // 如果队列中没有这个watcher，则推入这个watcher
    if (!queue.includes(watcher)) {
        queue.push(watcher);
    }
}
// 用来保存需要放在下一个JS执行队列执行的函数
const callbacks = [];
// true表示用来进入下一个JS执行队列的promise已经创建
let pending = false;
/**
 * 在下一个JS执行队列中执行函数
 * 当不传callback参数时则返回一个promise
 * @param callback 回调函数
 * @param ctx 回调函数的入参或promise的结果
 */
function nextTick(callback, ctx) {
    // 用来保存所返回的Promise内部的resolve方法
    let _resolve;
    // 如果promise未创建则创建一个新的promise，否则跳过
    if (!pending) {
        pending = true;
        Promise.resolve().then(() => {
            // 已进入"下一个JS执行队列"，将pending置为false
            pending = false;
            // 执行所有的回调函数
            callbacks.forEach((cb) => {
                cb();
            });
            // 清空函数池
            callbacks.splice(0, queue.length);
        });
    }
    // 添加回调函数（代理函数）。使用代理函数而不是直接添加源函数的原因是：当函数执行时需要将返回的promise的状态置为"已成功"
    callbacks.push(() => {
        // 执行源函数
        if (callback) {
            callback.call(ctx);
        }
        // 将返回的promise状态置为"已成功"
        if (_resolve) {
            _resolve(ctx);
        }
    });
    if (!callback) {
        // 返回一个新的promise，并使_resolve = resolve。这样，当下一个JS执行队列执行的时候，
        // 这个promise的状态也会变成"已成功"
        return new Promise((resolve) => {
            _resolve = resolve;
        });
    }
}

// 匹配标签的attribute，正则分组$1是属性名，$2是"="，$3是属性值
const attributeRE = /^\s*([^\s"'<>/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
// 匹配有效的标签名
const validTagNameRE = /[a-zA-Z_][\w-]*/;
// 匹配start标签的open部分，例如：<div
const startTagOpenRE = new RegExp(`^<(${validTagNameRE.source})`);
// 匹配start标签的close部分，例如：/> 或者 >。正则分组$1是"/"
const startTagCloseRE = /^\s*(\/)?>/;
// 匹配end标签，例如</div>
const endTagRE = new RegExp(`^</(${validTagNameRE.source})[^>]*>`);
// 匹配注释标签
const commentRE = /^<!--/;
// 自闭和标签名集合
const unaryTagNames = ['area', 'base', 'br', 'col', 'embed', 'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
// 默认回调函数都为空函数
const defaultOptions = {
    start: noop,
    end: noop,
    chars: noop,
    comment: noop,
};
/**
 * 该函数不会返回任何值。他仅对输入的html字符串进行解析（或称查找），
 * 分别解析start标签（例如：<div id="app">），end标签（</div>），文本和注释
 * 并在解析到内容时，调用对应回调函数，并将解析到的信息作为参数传递
 * @param html
 * @param options
 */
function parseHTML(html, options) {
    // 合并配置项
    options = Object.assign(defaultOptions, options);
    // 当html字符串不为空时继续解析
    while (html) {
        const textEnd = html.indexOf('<');
        // 如果字符"<"在开头位置，说明接下来解析的是标签或者注释
        if (textEnd === 0) {
            // 对html进行"注释"匹配
            const commentMatch = html.match(commentRE);
            // 如果匹配到的是注释
            if (commentMatch) {
                // 找到注释结尾的索引值
                const commentEnd = html.indexOf('-->');
                // 调用解析到注释对应的回调函数，将注释内容作为参数传递
                options.comment(html.substring(4, commentEnd));
                // 将html字符串起点挪到"-->"末尾位置，例如："<!--注释--><div id="app">hi!</div>" => "<div id="app">hi!</div>"
                advance(commentEnd + 3);
                continue;
            }
            // 对html进行"start标签open部分"匹配
            const startTagOpenMatch = html.match(startTagOpenRE);
            // 如果匹配到的是start标签的open部分
            if (startTagOpenMatch) {
                // 记下标签名
                const tagName = startTagOpenMatch[1];
                // 将html字符起点挪到start标签open部分末尾，例如："<div id="app">hi!</div>" => " id="app">hi!</div>"
                advance(startTagOpenMatch[0].length);
                // 下面开始解析标签属性
                // 保存标签属性/值的对象
                const attrs = {};
                let attrMatch;
                // 如果匹配到属性
                while (attrMatch = html.match(attributeRE)) {
                    const matchString = attrMatch[0];
                    // 获取属性名
                    const attrName = attrMatch[1];
                    // 获取属性值
                    const attrVal = attrMatch[3];
                    // 保存到attrs对象上
                    attrs[attrName] = attrVal || '';
                    // 将html字符串起点挪到属性后面，例如：" id="app">hi!</div>" => ">hi!</div>"
                    advance(matchString.length);
                }
                // 下面解析start标签的end部分
                const startTagCloseMatch = html.match(startTagCloseRE);
                // 若匹配到">"，
                if (startTagCloseMatch) {
                    // 将html字符串起点挪到">"后面，例如：">hi!</div>" => "hi!</div>"
                    advance(startTagCloseMatch[0].length);
                    // 若匹配分组匹配符号"/"或者标签名在数组unaryTagNames里，则说明该标签是自闭合标签
                    const unary = !!startTagCloseMatch[1] || unaryTagNames.indexOf(tagName) > -1;
                    // 调用解析到start标签对应的回调函数
                    options.start(tagName, attrs, unary);
                }
                else {
                    // 否则表示start标签未正确关闭（缺少">"）Vue会进行一定对容错处理。这里简单起见，直接抛出错误
                    console.error(`[Vue warn]: Error compiling template:
          start tag <${tagName}> has no closed. Miss close string: ">"`);
                }
                continue;
            }
            // 对html进行"end标签"匹配
            const endTagMatch = html.match(endTagRE);
            // 如果匹配成功
            if (endTagMatch) {
                const matchString = endTagMatch[0];
                const endTagName = endTagMatch[1];
                // 将html字符串起点挪到end标签后面，例如"</div><span>hey!</span>" => "<span>hey!</span>"
                advance(matchString.length);
                // 调用解析到end标签对应回调函数
                options.end(endTagName);
            }
            // 否则（字符"<"不在开头位置，或者没有找到"<"）接下来解析文本
        }
        else {
            // 若果找到了">"，就从开头截取到textEnd的位置作为文本内容，否则剩下的整个html都是文本内容
            const text = textEnd > 0 ? html.substring(0, textEnd) : html;
            // 将html字符串起点挪到文本内容后面，例如："hi!</div>" => "</div>"
            advance(text.length);
            // 调用解析到文本内容都回调函数
            options.chars(text);
        }
    }
    /**
     * 将html字符串起点向后挪动n个长度
     */
    function advance(n) {
        html = html.substring(n);
    }
}

// 匹配双花括号（表达式标签）。正则分组$1为双花括号中的内容
const expTagRE = /{{([\s\S]+?)}}/g;
/**
 * 将文本字符串解析成表达式字符串。例如"name: {{firstName + lastName}}" => "'name: '+_s(name + lastName)"
 */
function parseText(text) {
    // 匹配不到双花括号，说明不含表达式，直接返回undefined
    if (!expTagRE.test(text)) {
        return;
    }
    // 上一个匹配到的字符串终点（不含）索引值
    let lastEnd = expTagRE.lastIndex = 0;
    // 用来保存每对双花括号内的表达式和相邻双花括号间的字符串，最终输入的表达式字符串 = tokens.join('+')
    const tokens = [];
    let match;
    // 当匹配到双花括号
    while (match = expTagRE.exec(text)) {
        const exp = match[1].trim();
        const index = match.index;
        // index>last说明本次匹配到的双花括号和上次匹配到的双花括号之间隔着其他字符串
        if (index > lastEnd) {
            // 将隔着的字符串处理后推入tokens中
            const preString = JSON.stringify(text.substring(lastEnd, index));
            tokens.push(preString);
        }
        // 将匹配到的表达式处理后推入tokens中
        if (exp) {
            tokens.push(`_s(${exp})`);
        }
        // 更新lastEnd
        lastEnd = index + match[0].length;
    }
    // 如果lastEnd < text.length说明匹配结束后还剩一些字符串
    if (lastEnd < text.length) {
        // 则将剩余字符串处理后推入tokens中
        const lastString = JSON.stringify(text.substring(lastEnd));
        tokens.push(lastString);
    }
    // 处理tokens并返回最后结果。处理过程例如：['"name: "', '_s(firstName + lastName)'] => '"name: " + _s(firstName + lastName)'
    return tokens.join('+');
}

/**
 * 将字符串模板解析成AST对象
 */
function parse(template) {
    // 保存最后返回的AST根节点对象
    let astRoot;
    // 栈。存放已解析到的，但还未匹配到其end标签的AST对象（作为后续解析到的AST的父节点）
    const stack = [];
    let decoder = null;
    /**
     * 解码HTML字符串，例如："&lt;" => "<"
     * @param html
     */
    function decodeHTML(html) {
        decoder = decoder || document.createElement('div');
        decoder.innerHTML = html;
        const text = decoder.textContent;
        decoder.innerHTML = '';
        return text;
    }
    // 开始解析（查找）模板里的start标签，end标签，文本和注释
    // 本项目为简单起见，固定不保留注释，故在此不配置comment函数（处理注释的回调函数）
    parseHTML(template.trim(), {
        // 解析到start标签
        start(tag, attrs, unary) {
            // 根据参数创建一个AST对象
            const astNode = {
                tag,
                attrs,
                unary,
            };
            //取栈中最后一个AST作为父节点
            const parent = stack[stack.length - 1];
            // 如果这个父节点存在
            if (parent) {
                // 将astNode添加到父节点的children中去
                parent.children = parent.children || [];
                parent.children.push(astNode);
            }
            else {
                // 否则这个节点是根节点，保存到astRoot变量上
                astRoot = astRoot || astNode;
            }
            // 如果astNode不是自闭合标签，则将它推入栈中，作为后面解析生成的AST的父节点
            if (!unary) {
                stack.push(astNode);
            }
        },
        // 解析到end标签
        end(tag) {
            // 如果和栈中最后一个AST的标签名不同，说明标签没有正确闭合，那么抛出错误
            const parentTag = stack[stack.length - 1].tag;
            if (parentTag !== tag) {
                console.error(`[Vue warn]: Error compiling template:
        tag <${parentTag}> has no matching end tag.`);
            }
            // 如果标签正确闭合了，弹出栈末尾的AST。因为它已经闭合，不会再解析到它的子节点了。
            stack.pop();
        },
        // 解析到文本
        chars(text) {
            // 解码，"&lt;" => "<"
            text = decodeHTML(text);
            const parent = stack[stack.length - 1];
            // 如果栈中没有父节点，说明这段文本在根节点之外，抛弃这段文本
            if (!parent) {
                return;
            }
            parent.children = parent.children || [];
            const lastChild = parent.children[parent.children.length - 1];
            // 如果父节点的最后一个子节点是文本
            if (lastChild && !lastChild.tag) {
                // 则合并这两个文本
                lastChild.text = lastChild.text + text;
            }
            else {
                // 否则将该文本AST添加到父节点的子节点集合中去
                parent.children.push({
                    text,
                    expression: parseText(text), // 文本表达式
                });
            }
        },
    });
    return astRoot;
}

// 匹配v-bind指令绑定的属性
const bindRE = /^(?:v-bind)?:([\s\S]+)/;
/**
 * 根据AST对象生成渲染函数（渲染生成虚拟DOM）代码字符串
 * 生成的代码字符串类似这样：with(this) {return _c('div', {attrs: {...}, style: {...}}, [_c(...),_c(...)])}
 * "with(this)"中的this会指向Vue实例
 */
function generate(ast) {
    const code = generateElement(ast);
    return `with(this) {return ${code}}`;
}
/**
 * 根据AST对象生成渲染函数代码字符串中，"创建VNode实例"这部分代码
 * 生成的代码字符串类似这样：_c('div', {attrs: {...}, style: {...}}, [_c(...),_c(...)])
 * 或这样：_v(title + content)
 * 或这样：_v("文本内容")
 * _c()是创建元素型VNode的方法
 * _v()是创建文本型VNode的方法
 */
function generateElement(ast) {
    let childrenCode = '';
    // 如果有AST对象，调用generateChildren生成对应代码
    if (ast.children && ast.children.length > 0) {
        childrenCode = generateChildren(ast.children);
    }
    // 如果ast对象当前描述的是元素，则返回"使用_c()创建元素型VNode"的代码，否则返回"使用_v()创建文本型VNode"的代码
    return ast.tag ? `_c('${ast.tag}', ${generateData(ast.attrs)}, [${childrenCode}])` : `_v(${ast.expression || JSON.stringify(ast.text)})`;
}
/**
 * 根据AST子对象集合生成渲染函数代码字符串中，"创建子VNode实例"这部分代码
 * 生成的代码字符串类似这样：_c(...),_c(...),v(...)
 */
function generateChildren(children) {
    return children
        .map((child) => {
        return generateElement(child);
    })
        .join(',');
}
/**
 * 根据AST对象attrs属性生成渲染函数代码字符串中，"入参data"这部分代码
 * 生成的代码字符串类似这样：{attrs: {id:"app"}, style: {color: color}, staticStyle: {overflow: "hidden"}, class="{hidden: hidden}", staticClass="title title1"}
 */
function generateData(props) {
    if (!props) {
        return '{}';
    }
    let data = '{';
    let attrs = '{';
    // 遍历AST的attrs
    Object.keys(props).forEach((prop) => {
        // ast的attrs.style用来生成staticStyle的代码
        if (prop === 'style') {
            let staticStyles = '{';
            // 用";"分割字符串，得到类似这样的数组['color: red', 'font-size': '18px', ...]
            props[prop].split(';').forEach((styleItem) => {
                // 继续用";"分割字符串，得到CSS样式的属性和值，类似这样：['color', 'red']
                const propertyVal = styleItem.split(':');
                // 如果分割成功
                if (propertyVal.length > 1) {
                    // 增加一组样式，类似这样：fontSize: "18px"
                    // 属性名要转成驼峰式命名
                    // 用JSON.stringify()处理字符串可以得到一个被双引号包裹的字符串，且字符串自身的双引号会自动带上转义符。比如 ab"c"d => "ab\"c\"d"
                    staticStyles += `${camelize(propertyVal[0].trim())}: ${JSON.stringify(propertyVal[1].trim())},`;
                }
            });
            // 如果staticStyles长度大于1， 说明staticStyles存在
            if (staticStyles.length > 1) {
                // 删除末尾最后一个逗号，补全花括号
                staticStyles = staticStyles.slice(0, -1) + '}';
                // 将staticStyle添加进data
                data += `staticStyle:${JSON.stringify(staticStyles)}},`;
            }
            return;
        }
        // ast的attrs.class用来生成staticClass的代码
        if (prop === 'class') {
            data += `staticClass:${JSON.stringify(props[prop])},`;
            return;
        }
        // 匹配v-bind指令绑定的属性
        const match = prop.match(bindRE);
        // 如果匹配到
        if (match) {
            // 如果v-bind绑定的是style或class。其值保留原有样子（不用JSON.stringify()转换成被引号包裹的字符串）
            if (['style', 'class'].indexOf(match[1]) > -1) {
                // 则添加到data里
                data += `${match[1]}:${props[prop]},`;
                // 否则添加到attrs里
            }
            else {
                attrs += `${match[1]}:${props[prop]},`;
            }
            return;
        }
        // 遇到v-cloak指令，删除这个属性
        if (prop === 'v-cloak') {
            return;
        }
        // 未匹配到v-bind的属性和值使用JSON.stringify()转换成被引号包裹的字符串
        attrs += `${JSON.stringify(prop)}:${JSON.stringify(props[prop])},`;
    });
    // 如果attrs字符串长度大于1说明attrs存在
    if (attrs.length > 1) {
        // 则删除最后一个逗号，补全花括号
        attrs = attrs.slice(0, -1) + '}';
        // 添加到data中去
        data += `attrs:${attrs},`;
    }
    // 如果data字符串长度大于1说明data存在
    if (data.length > 1) {
        // 则删除最后一个逗号，
        data = data.slice(0, -1);
    }
    // 补全花括号
    data += '}';
    return data;
}

function compiler(template) {
    // 将模板转成AST
    const ast = parse(template);
    // 将AST转成渲染函数的函数体字符串
    return generate(ast);
}

/**
 * Vue class
 */
class Vue {
    constructor(options) {
        this.$options = Object.assign({}, options);
        this.$el = document.querySelector(this.$options.el);
        def(this, '$data', options.data);
        this._data = this.$data;
        // 将data的每一个属性都代理到Vue实例上，这样可以直接通过Vue实例修改数据
        Object.keys(this._data).forEach((key) => {
            this[key] = this.$data[key];
            // 通过定义getter/setter，当读写Vue实例的代理属性（与data的直接子属性同名）时，实际读写的是data
            Object.defineProperty(this, key, {
                enumerable: true,
                configurable: true,
                get() {
                    return this.$data[key];
                },
                set(v) {
                    this.$data[key] = v;
                },
            });
        });
        // 如果没有配置render函数
        if (!this.$options.render) {
            // 字符串模板等于配置中的模板，或者真实DOM的outerHTML字符串
            const template = this.$options.template || this.$el.outerHTML;
            // 编译模板为渲染函数
            this._renderer = new Function('', compiler(template));
        }
        else {
            this._renderer = this.$options.render;
        }
        // 将data对象转换成被观察对象
        observe(this.$data);
        // 新建Watcher实例。当相关数据发生变化，该watcher会被通知，从而调用fn更新该Vue实例对应的视图（即$el）
        this._watcher = new Watcher(() => {
            // 当watcher被通知，调用_render()生成新的虚拟DOM，再调用_update()更新视图
            this._update(this._render());
        });
    }
    /**
     * 创建并返回一个元素型VNode实例（虚拟DOM）
     * @param tag 标签名
     * @param data 描述元素的properties的相关数据
     * @param children 子元素集合
     * @private
     */
    $createElement(tag, data, children) {
        return createElementVNode(tag, data, children);
    }
    /**
     * 根据当前数据渲染生成虚拟DOM
     */
    _render() {
        // 调用渲染函数，同时将渲染函数内部的this指向Vue实例
        return this._renderer.call(this);
    }
    /**
     * 对比新老虚拟DOM，更新视图
     */
    _update(vnode) {
        // 如果this._vnode没有值，说明需要patch真实DOM和虚拟DOM
        const oldVnode = this._vnode || this.$el;
        // 保存新虚拟DOM，下次patch它将作为老虚拟DOM
        this._vnode = vnode;
        // patch老虚拟DOM(或真实虚拟DOM)和新虚拟DOM
        patch(oldVnode, vnode);
        // 保存新的真实DOM节点（在初次更新的时候，老$el会被删除）
        this.$el = vnode.elm;
    }
    // 下面的方法都是提供给渲染函数使用的
    /**
     * 创建并返回一个元素型VNode实例（虚拟DOM）
     * @param tag 标签名
     * @param data 描述元素的properties的相关数据
     * @param children 子元素集合
     * @private
     */
    _c(tag, data, children) {
        return createElementVNode(tag, data, children);
    }
    /**
     * 创建并返回一个文本型VNode实例
     * @param text 文本字符串
     * @private
     */
    _v(text) {
        return createTextVNode(text);
    }
    /**
     * 透传调用String方法
     * @param text
     * @private
     */
    _s(text) {
        return String(text);
    }
}

export { Vue as default };
//# sourceMappingURL=vue.esm.js.map
