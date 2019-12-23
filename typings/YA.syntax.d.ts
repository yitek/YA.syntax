/**
 * 文本阅读器
 *
 * @export
 * @interface ITextReader
 */
export interface ITextReader {
    /**
     * 当前字符位置
     *
     * @type {number}
     * @memberof ITextReader
     */
    at: number;
    /**
     * 当前行
     *
     * @type {number}
     * @memberof ITextReader
     */
    line: number;
    /**
     * 终结符
     *
     * @type {number}
     * @memberof ITextReader
     */
    end: number;
    /**
     * 获取下一个字符
     *
     * @returns {number}
     * @memberof ITextReader
     */
    fetech(): number;
    /**
     * 推回一个字符
     *
     * @param {number} ch
     * @returns {ITextReader}
     * @memberof ITextReader
     */
    pushback(ch: number): ITextReader;
    EOF: boolean;
}
/**
 * 字符串类型的文本阅读器
 *
 * @export
 * @class StringTextReader
 * @implements {ITextReader}
 */
export declare class StringTextReader implements ITextReader {
    raw: string;
    at: number;
    line: number;
    _pushedbackChar: number;
    end: number;
    EOF: boolean;
    constructor(input: string, endChar?: number);
    /**
     * 获取下一个字符
     *
     * @returns {number}
     * @memberof ITextReader
     */
    fetech(): number;
    pushback(ch: number): ITextReader;
    toString(): string;
}
export interface IRegularDescriptor {
    minTimes?: number;
    maxTimes?: number;
    times?: number;
    navigate?: boolean;
    token?: string;
}
export declare enum RegularMatchResults {
    /**
     * 不确定,中间态
     */
    Unkcertain = 0,
    /**
     *已经匹配,最终态
        */
    Matched = 1,
    /**
     * 不匹配 ，终态
     */
    NotMatch = 2,
    /**
     * 空匹配,终态
     */
    Empty = 3,
}
export interface IRegularMatch {
    at: number;
    line: number;
    length: number;
    input: ITextReader;
    regular: Regular;
}
export interface IRegularContext {
    input: ITextReader;
    onMatched?: (match: IRegularMatch) => void;
}
export declare class RegularContext {
    input: ITextReader;
    onMatched?: (match: IRegularMatch) => void;
    constructor(raw: string | ITextReader);
    toString(): string;
}
export declare class Regular {
    _minTimes: number;
    _maxTimes?: number;
    _repeatedTimes: number;
    _isRepeatCheck: boolean;
    Token: string;
    constructor(des: IRegularDescriptor | number | string);
    Reset(): Regular;
    Match(ctx: IRegularContext): IRegularMatch;
    CheckMatch(input: ITextReader): RegularMatchResults;
    protected InternalCheck(ch: number): RegularMatchResults;
    toString(braced?: boolean): string;
}
export declare class CharsetRegular extends Regular {
    _navigate: boolean;
    Chars: string;
    _code: number;
    _minCode: number;
    _maxCode: number;
    constructor(chars: string, des?: IRegularDescriptor | boolean | number | string);
    _CheckChar(ch: number): RegularMatchResults;
    _CheckRange(ch: number): RegularMatchResults;
    _Check(ch: number): RegularMatchResults;
    toString(): string;
}
