import {parse} from './parser'
import {generate} from './codegen'

export function compiler(template: string): string {
  // 将模板转成AST
  const ast = parse(template)
  // 将AST转成渲染函数的函数体字符串
  return generate(ast)
}
