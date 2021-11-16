/**
 * 根据AST对象生成渲染函数（渲染生成虚拟DOM）代码字符串
 * 生成的代码字符串类似这样：with(this) {return _c('div', {attrs: {...}, style: {...}}, [_c(...),_c(...)])}
 * "with(this)"中的this会指向Vue实例
 */
export declare function generate(ast: any): string;
