import {parseHTML} from './html-parser'
import {parseText} from './text-parser'

export interface AST {
  tag?: string // 标签名
  attrs?: {[p:string]: string} // 属性对象
  text?: string // 文本内容
  expression? :  string
  unary?: boolean // 是否是自闭合标签
  children?: AST[] // 子树
}

/**
 * 将字符串模板解析成AST对象
 */
export function parse(template: string): AST {
  // 保存最后返回的AST根节点对象
  let astRoot: AST
  // 栈。存放已解析到的，但还未匹配到其end标签的AST对象（作为后续解析到的AST的父节点）
  const stack: AST[] = []

  let decoder: Element = null
  /**
   * 解码HTML字符串，例如："&lt;" => "<"
   * @param html
   */
  function decodeHTML(html: string): string {
    decoder = decoder || document.createElement('div')
    decoder.innerHTML = html
    const text = decoder.textContent
    decoder.innerHTML = ''
    return text
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
      }
      //取栈中最后一个AST作为父节点
      const parent = stack[stack.length - 1]

      // 如果这个父节点存在
      if (parent) {
        // 将astNode添加到父节点的children中去
        parent.children = parent.children || []
        parent.children.push(astNode)
      } else {
        // 否则这个节点是根节点，保存到astRoot变量上
        astRoot = astRoot || astNode
      }

      // 如果astNode不是自闭合标签，则将它推入栈中，作为后面解析生成的AST的父节点
      if (!unary) {
        stack.push(astNode)
      }
    },
    // 解析到end标签
    end(tag) {
      // 如果和栈中最后一个AST的标签名不同，说明标签没有正确闭合，那么抛出错误
      const parentTag = stack[stack.length - 1].tag
      if (parentTag !== tag) {
        console.error(`[Vue warn]: Error compiling template:
        tag <${parentTag}> has no matching end tag.`)
      }
      // 如果标签正确闭合了，弹出栈末尾的AST。因为它已经闭合，不会再解析到它的子节点了。
      stack.pop()
    },
    // 解析到文本
    chars(text) {
      // 解码，"&lt;" => "<"
      text = decodeHTML(text)
      const parent = stack[stack.length - 1]
      // 如果栈中没有父节点，说明这段文本在根节点之外，抛弃这段文本
      if(!parent) {
        return
      }
      parent.children = parent.children || []
      const lastChild = parent.children[parent.children.length - 1]
      // 如果父节点的最后一个子节点是文本
      if (lastChild && !lastChild.tag) {
        // 则合并这两个文本
        lastChild.text = lastChild.text + text
        lastChild.expression = parseText(lastChild.text)
      } else {
        // 否则将该文本AST添加到父节点的子节点集合中去
        parent.children.push({
          text, // 文本内容
          expression: parseText(text), // 文本表达式
        })
      }
    },
  })
  return astRoot
}
