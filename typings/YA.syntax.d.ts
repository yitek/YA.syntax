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
    fetech(handler: (ch: number) => RegularMatchResults): RegularMatchResults;
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
    fetech(handler: (ch: number) => RegularMatchResults): RegularMatchResults;
    toString(): string;
}
export interface IRegularDescriptor {
    minTimes?: number;
    maxTimes?: number;
    times?: number;
    navigate?: boolean;
    token?: string;
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
    InternalCheck(input: ITextReader): RegularMatchResults;
    toString(braced?: boolean): string;
}
export declare class CharsetRegular extends Regular {
    private _navigate;
    Chars: string;
    private _code;
    private _minCode;
    private _maxCode;
    constructor(chars: string, des?: IRegularDescriptor | boolean | number | string);
    _CheckChar(input: ITextReader): RegularMatchResults;
    _CheckRange(input: ITextReader): RegularMatchResults;
    _Check(input: ITextReader): RegularMatchResults;
    toString(): string;
}
export declare class LiteralRegular extends Regular {
    Chars: string;
    private _matchAt;
    constructor(chars: string, des?: IRegularDescriptor | number);
    Reset(): LiteralRegular;
    InternalCheck(input: ITextReader): RegularMatchResults;
    toString(braced?: boolean): string;
}
export declare class PolyRegular extends Regular {
    Regulars: Regular[];
    constructor(des?: IRegularDescriptor | number);
    Charset(chars: string, des?: IRegularDescriptor | number): PolyRegular;
    Literal(chars: string, des?: IRegularDescriptor | number): PolyRegular;
}
export declare class SequenceRegular extends PolyRegular {
    private _stepAt;
    constructor(des?: IRegularDescriptor | number);
    Reset(): SequenceRegular;
    InternalCheck(input: ITextReader): RegularMatchResults;
    optional(builder: (optional: OptionalRegular) => void, des?: IRegularDescriptor | number): SequenceRegular;
    toString(braced?: boolean): string;
}
export declare class OptionalRegular extends PolyRegular {
    private _liveRegulars;
    private _emptyRegular;
    constructor(des?: IRegularDescriptor | number);
    Reset(): SequenceRegular;
    sequence(builder: (seq: SequenceRegular) => void, des?: IRegularDescriptor | number): OptionalRegular;
    InternalCheck(input: ITextReader): RegularMatchResults;
    toString(braced?: boolean): string;
}
