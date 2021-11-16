/* eslint-disable @typescript-eslint/no-empty-function */
export type AnyFunction = (...args: any[]) => any

export type AnyObject = {
  [p: string]: any
}

/**
 * 是否未定义
 */
export function isUndef(v: any): boolean {
  return v === undefined || v === null
}

/**
 * 是否已定义
 */
export function isDef(v: any): boolean {
  return v !== undefined && v !== null
}

/**
 * 是否为对象
 */
export function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object'
}

/**
 * 是否为普通对象
 */
export function isPlainObject(obj: any): boolean {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

/**
 * 空函数
 */
export function noop() {}

/**
 * 为纯函数创建一个具备缓存版本的函数
 */
export function cached<T>(fn: (arg: string) => T) : (arg: string)=> T {
  const cache = Object.create(null)
  return function cachedFn (str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}

/**
 * 将分割符连接的字符串转换成驼峰式
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})
