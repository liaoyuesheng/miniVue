/**
 * 将文本字符串解析成表达式字符串。例如"name: {{firstName + lastName}}" => "'name: '+_s(name + lastName)"
 */
export declare function parseText(text: any): string;
