export interface AST {
    tag?: string;
    attrs?: {
        [p: string]: string;
    };
    text?: string;
    expression?: string;
    unary?: boolean;
    children?: AST[];
}
/**
 * 将字符串模板解析成AST对象
 */
export declare function parse(template: string): AST;
