import {camelize} from '../../shared/util'

// 匹配v-bind指令绑定的属性
const bindRE = /^(?:v-bind)?:([\s\S]+)/

/**
 * 根据AST对象生成渲染函数（渲染生成虚拟DOM）代码字符串
 * 生成的代码字符串类似这样：with(this) {return _c('div', {attrs: {...}, style: {...}}, [_c(...),_c(...)])}
 * "with(this)"中的this会指向Vue实例
 */
export function generate(ast): string {
  const code = generateElement(ast)
  return `with(this) {return ${code}}`
}

/**
 * 根据AST对象生成渲染函数代码字符串中，"创建VNode实例"这部分代码
 * 生成的代码字符串类似这样：_c('div', {attrs: {...}, style: {...}}, [_c(...),_c(...)])
 * 或这样：_v(title + content)
 * 或这样：_v("文本内容")
 * _c()是创建元素型VNode的方法
 * _v()是创建文本型VNode的方法
 */
function generateElement(ast): string {
  let childrenCode = ''

  // 如果有AST对象，调用generateChildren生成对应代码
  if (ast.children && ast.children.length > 0) {
    childrenCode = generateChildren(ast.children)
  }

  // 如果ast对象当前描述的是元素，则返回"使用_c()创建元素型VNode"的代码，否则返回"使用_v()创建文本型VNode"的代码
  return ast.tag ? `_c('${ast.tag}', ${generateData(ast.attrs)}, [${childrenCode}])` : `_v(${ast.expression || JSON.stringify(ast.text)})`
}

/**
 * 根据AST子对象集合生成渲染函数代码字符串中，"创建子VNode实例"这部分代码
 * 生成的代码字符串类似这样：_c(...),_c(...),v(...)
 */
function generateChildren(children): string {
  return children
    .map((child) => {
      return generateElement(child)
    })
    .join(',')
}

/**
 * 根据AST对象attrs属性生成渲染函数代码字符串中，"入参data"这部分代码
 * 生成的代码字符串类似这样：{attrs: {id:"app"}, style: {color: color}, staticStyle: {overflow: "hidden"}, class="{hidden: hidden}", staticClass="title title1"}
 */
function generateData(props): string {
  if (!props) {
    return '{}'
  }

  let data = '{'
  let attrs = '{'
  // 遍历AST的attrs
  Object.keys(props).forEach((prop) => {
    // ast的attrs.style用来生成staticStyle的代码
    if (prop === 'style') {
      let staticStyles = '{'
      // 用";"分割字符串，得到类似这样的数组['color: red', 'font-size': '18px', ...]
      props[prop].split(';').forEach((styleItem) => {
        // 继续用";"分割字符串，得到CSS样式的属性和值，类似这样：['color', 'red']
        const propertyVal = styleItem.split(':')
        // 如果分割成功
        if (propertyVal.length > 1) {
          // 增加一组样式，类似这样：fontSize: "18px"
          // 属性名要转成驼峰式命名
          // 用JSON.stringify()处理字符串可以得到一个被双引号包裹的字符串，且字符串自身的双引号会自动带上转义符。比如 ab"c"d => "ab\"c\"d"
          staticStyles += `${camelize(propertyVal[0].trim())}: ${JSON.stringify(propertyVal[1].trim())},`
        }
      })

      // 如果staticStyles长度大于1， 说明staticStyles存在
      if(staticStyles.length > 1) {
        // 删除末尾最后一个逗号，补全花括号
        staticStyles = staticStyles.slice(0, -1) + '}'
        // 将staticStyle添加进data
        data += `staticStyle:${JSON.stringify(staticStyles)}},`
      }
      return
    }

    // ast的attrs.class用来生成staticClass的代码
    if (prop === 'class') {
      data += `staticClass:${JSON.stringify(props[prop])},`
      return
    }

    // 匹配v-bind指令绑定的属性
    const match = prop.match(bindRE)
    // 如果匹配到
    if (match) {
      // 如果v-bind绑定的是style或class。其值保留原有样子（不用JSON.stringify()转换成被引号包裹的字符串）
      if (['style', 'class'].indexOf(match[1]) > -1) {
        // 则添加到data里
        data += `${match[1]}:${props[prop]},`
        // 否则添加到attrs里
      } else {
        attrs += `${match[1]}:${props[prop]},`
      }
      return
    }

    // 遇到v-cloak指令，删除这个属性
    if(prop === 'v-cloak') {
      return
    }

    // 未匹配到v-bind的属性和值使用JSON.stringify()转换成被引号包裹的字符串
    attrs += `${JSON.stringify(prop)}:${JSON.stringify(props[prop])},`
  })

  // 如果attrs字符串长度大于1说明attrs存在
  if (attrs.length > 1) {
    // 则删除最后一个逗号，补全花括号
    attrs = attrs.slice(0, -1) + '}'
    // 添加到data中去
    data += `attrs:${attrs},`
  }

  // 如果data字符串长度大于1说明data存在
  if (data.length > 1) {
    // 则删除最后一个逗号，
    data = data.slice(0, -1)
  }

  // 补全花括号
  data += '}'
  return data
}
