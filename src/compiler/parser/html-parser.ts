import {noop} from '../../shared/util'
// 匹配标签的attribute，正则分组$1是属性名，$2是"="，$3是属性值
const attributeRE = /^\s*([^\s"'<>/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// 匹配有效的标签名
const validTagNameRE = /[a-zA-Z_][\w-]*/
// 匹配start标签的open部分，例如：<div
const startTagOpenRE = new RegExp(`^<(${validTagNameRE.source})`)
// 匹配start标签的close部分，例如：/> 或者 >。正则分组$1是"/"
const startTagCloseRE = /^\s*(\/)?>/
// 匹配end标签，例如</div>
const endTagRE = new RegExp(`^</(${validTagNameRE.source})[^>]*>`)
// 匹配注释标签
const commentRE = /^<!--/
// 自闭和标签名集合
const unaryTagNames = ['area', 'base', 'br', 'col', 'embed', 'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']

export interface ParseHTMLOptions {
  /**
   * 解析到start标签回调函数
   * @param tagName 标签名
   * @param attrs attributes对象
   * @param unary 是否是自闭和标签
   */
  start?: (tagName: string, attrs: {[p:string]: string}, unary: boolean) => void
  /**
   * 解析到end标签回调函数
   * @param tagName 标签名
   */
  end?: (tagName: string) => void
  /**
   * 解析到文本回调函数
   * @param text 文本内容
   */
  chars?: (text: string) => void
  /**
   * 解析到注释回调函数
   * @param text 注释内容
   */
  comment?: (text: string) => void
}

// 默认回调函数都为空函数
const defaultOptions: ParseHTMLOptions = {
  start: noop,
  end: noop,
  chars: noop,
  comment: noop,
}

/**
 * 该函数不会返回任何值。他仅对输入的html字符串进行解析（或称查找），
 * 分别解析start标签（例如：<div id="app">），end标签（</div>），文本和注释
 * 并在解析到内容时，调用对应回调函数，并将解析到的信息作为参数传递
 * @param html
 * @param options
 */
export function parseHTML(html: string, options: ParseHTMLOptions) {
  // 合并配置项
  options = Object.assign(defaultOptions, options)

  // 当html字符串不为空时继续解析
  while (html) {
    const textEnd = html.indexOf('<')

    // 如果字符"<"在开头位置，说明接下来解析的是标签或者注释
    if (textEnd === 0) {
      // 对html进行"注释"匹配
      const commentMatch = html.match(commentRE)
      // 如果匹配到的是注释
      if (commentMatch) {
        // 找到注释结尾的索引值
        const commentEnd = html.indexOf('-->')
        // 调用解析到注释对应的回调函数，将注释内容作为参数传递
        options.comment(html.substring(4, commentEnd))
        // 将html字符串起点挪到"-->"末尾位置，例如："<!--注释--><div id="app">hi!</div>" => "<div id="app">hi!</div>"
        advance(commentEnd + 3)
        continue
      }

      // 对html进行"start标签open部分"匹配
      const startTagOpenMatch = html.match(startTagOpenRE)
      // 如果匹配到的是start标签的open部分
      if (startTagOpenMatch) {
        // 记下标签名
        const tagName = startTagOpenMatch[1]
        // 将html字符起点挪到start标签open部分末尾，例如："<div id="app">hi!</div>" => " id="app">hi!</div>"
        advance(startTagOpenMatch[0].length)
        // 下面开始解析标签属性
        // 保存标签属性/值的对象
        const attrs = {}
        let attrMatch
        // 如果匹配到属性
        while (attrMatch = html.match(attributeRE)) {
          const matchString = attrMatch[0]
          // 获取属性名
          const attrName = attrMatch[1]
          // 获取属性值
          const attrVal = attrMatch[3]
          // 保存到attrs对象上
          attrs[attrName] = attrVal || ''
          // 将html字符串起点挪到属性后面，例如：" id="app">hi!</div>" => ">hi!</div>"
          advance(matchString.length)
        }

        // 下面解析start标签的end部分
        const startTagCloseMatch = html.match(startTagCloseRE)
        // 若匹配到">"，
        if (startTagCloseMatch) {
          // 将html字符串起点挪到">"后面，例如：">hi!</div>" => "hi!</div>"
          advance(startTagCloseMatch[0].length)
          // 若匹配分组匹配符号"/"或者标签名在数组unaryTagNames里，则说明该标签是自闭合标签
          const unary = !!startTagCloseMatch[1] || unaryTagNames.indexOf(tagName) > -1
          // 调用解析到start标签对应的回调函数
          options.start(tagName, attrs, unary)
        } else {
          // 否则表示start标签未正确关闭（缺少">"）Vue会进行一定对容错处理。这里简单起见，直接抛出错误
          console.error(`[Vue warn]: Error compiling template:
          start tag <${tagName}> has no closed. Miss close string: ">"`)
        }
        continue
      }

      // 对html进行"end标签"匹配
      const endTagMatch = html.match(endTagRE)
      // 如果匹配成功
      if (endTagMatch) {
        const matchString = endTagMatch[0]
        const endTagName = endTagMatch[1]
        // 将html字符串起点挪到end标签后面，例如"</div><span>hey!</span>" => "<span>hey!</span>"
        advance(matchString.length)
        // 调用解析到end标签对应回调函数
        options.end(endTagName)
      }
      // 否则（字符"<"不在开头位置，或者没有找到"<"）接下来解析文本
    } else {
      // 若果找到了">"，就从开头截取到textEnd的位置作为文本内容，否则剩下的整个html都是文本内容
      const text = textEnd > 0 ? html.substring(0, textEnd) : html
      // 将html字符串起点挪到文本内容后面，例如："hi!</div>" => "</div>"
      advance(text.length)
      // 调用解析到文本内容都回调函数
      options.chars(text)
    }
  }

  /**
   * 将html字符串起点向后挪动n个长度
   */
  function advance(n) {
    html = html.substring(n)
  }
}
