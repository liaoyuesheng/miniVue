export declare type AnyFunction = (...args: any[]) => any;
export declare type AnyObject = {
    [p: string]: any;
};
/**
 * 是否未定义
 */
export declare function isUndef(v: any): boolean;
/**
 * 是否已定义
 */
export declare function isDef(v: any): boolean;
/**
 * 是否为对象
 */
export declare function isObject(obj: any): boolean;
/**
 * 是否为普通对象
 */
export declare function isPlainObject(obj: any): boolean;
/**
 * 空函数
 */
export declare function noop(): void;
/**
 * 为纯函数创建一个具备缓存版本的函数
 */
export declare function cached<T>(fn: (arg: string) => T): (arg: string) => T;
export declare const camelize: (arg: string) => string;
