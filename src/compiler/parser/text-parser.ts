// 匹配双花括号（表达式标签）。正则分组$1为双花括号中的内容
const expTagRE = /{{([\s\S]+?)}}/g

/**
 * 将文本字符串解析成表达式字符串。例如"name: {{firstName + lastName}}" => "'name: '+_s(name + lastName)"
 */
export function parseText(text): string {
  // 匹配不到双花括号，说明不含表达式，直接返回undefined
  if(!expTagRE.test(text)) {
    return
  }
  // 上一个匹配到的字符串终点（不含）索引值
  let lastEnd = expTagRE.lastIndex = 0
  // 用来保存每对双花括号内的表达式和相邻双花括号间的字符串，最终输入的表达式字符串 = tokens.join('+')
  const tokens = []
  let match

  // 当匹配到双花括号
  while(match = expTagRE.exec(text)) {
    const exp = match[1].trim()
    const index = match.index

    // index>last说明本次匹配到的双花括号和上次匹配到的双花括号之间隔着其他字符串
    if(index > lastEnd) {
      // 将隔着的字符串处理后推入tokens中
      const preString = JSON.stringify(text.substring(lastEnd, index))
      tokens.push(preString)
    }

    // 将匹配到的表达式处理后推入tokens中
    if(exp) {
      tokens.push(`_s(${exp})`)
    }

    // 更新lastEnd
    lastEnd = index + match[0].length
  }

  // 如果lastEnd < text.length说明匹配结束后还剩一些字符串
  if(lastEnd < text.length) {
    // 则将剩余字符串处理后推入tokens中
    const lastString = JSON.stringify(text.substring(lastEnd))
    tokens.push(lastString)
  }
  // 处理tokens并返回最后结果。处理过程例如：['"name: "', '_s(firstName + lastName)'] => '"name: " + _s(firstName + lastName)'
  return tokens.join('+')
}
