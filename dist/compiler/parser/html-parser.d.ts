export interface ParseHTMLOptions {
    /**
     * 解析到start标签回调函数
     * @param tagName 标签名
     * @param attrs attributes对象
     * @param unary 是否是自闭和标签
     */
    start?: (tagName: string, attrs: {
        [p: string]: string;
    }, unary: boolean) => void;
    /**
     * 解析到end标签回调函数
     * @param tagName 标签名
     */
    end?: (tagName: string) => void;
    /**
     * 解析到文本回调函数
     * @param text 文本内容
     */
    chars?: (text: string) => void;
    /**
     * 解析到注释回调函数
     * @param text 注释内容
     */
    comment?: (text: string) => void;
}
/**
 * 该函数不会返回任何值。他仅对输入的html字符串进行解析（或称查找），
 * 分别解析start标签（例如：<div id="app">），end标签（</div>），文本和注释
 * 并在解析到内容时，调用对应回调函数，并将解析到的信息作为参数传递
 * @param html
 * @param options
 */
export declare function parseHTML(html: string, options: ParseHTMLOptions): void;
