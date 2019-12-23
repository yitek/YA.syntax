"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 字符串类型的文本阅读器
 *
 * @export
 * @class StringTextReader
 * @implements {ITextReader}
 */
var StringTextReader = /** @class */ (function () {
    function StringTextReader(input, endChar) {
        this.raw = input;
        this.at = 0;
        this.line = 0;
        this.end = endChar || 0;
    }
    /**
     * 获取下一个字符
     *
     * @returns {number}
     * @memberof ITextReader
     */
    StringTextReader.prototype.fetech = function () {
        if (this._pushedbackChar) {
            var ch_1 = this._pushedbackChar;
            this._pushedbackChar = undefined;
            this.at++;
            return ch_1;
        }
        if (this.at >= this.raw.length) {
            this.EOF = true;
            return this.end;
        }
        var ch = this.raw.charCodeAt(this.at++);
        if (ch === 13)
            this.line++;
        return ch;
    };
    StringTextReader.prototype.pushback = function (ch) {
        if (this._pushedbackChar !== undefined)
            throw new Error("已经有一个Pushback字符了，不允许再pushback.");
        if (this.EOF)
            return this;
        //if(ch===this.EndChar) throw new Error("不允许Pushback终结符");
        this._pushedbackChar = ch;
        this.at--;
        return this;
    };
    StringTextReader.prototype.toString = function () {
        return this.raw;
    };
    return StringTextReader;
}());
exports.StringTextReader = StringTextReader;
var RegularMatchResults;
(function (RegularMatchResults) {
    /**
     * 不确定,中间态
     */
    RegularMatchResults[RegularMatchResults["Unkcertain"] = 0] = "Unkcertain";
    /**
     *已经匹配,最终态
        */
    RegularMatchResults[RegularMatchResults["Matched"] = 1] = "Matched";
    /**
     * 不匹配 ，终态
     */
    RegularMatchResults[RegularMatchResults["NotMatch"] = 2] = "NotMatch";
    /**
     * 空匹配,终态
     */
    RegularMatchResults[RegularMatchResults["Empty"] = 3] = "Empty";
})(RegularMatchResults = exports.RegularMatchResults || (exports.RegularMatchResults = {}));
var RegularContext = /** @class */ (function () {
    function RegularContext(raw) {
        if (typeof raw === "string")
            this.input = new StringTextReader(raw);
        else
            this.input = raw;
    }
    RegularContext.prototype.toString = function () { return this.input.toString(); };
    return RegularContext;
}());
exports.RegularContext = RegularContext;
var Regular = /** @class */ (function () {
    function Regular(des) {
        this._repeatedTimes = 0;
        var t = typeof des;
        if (t === "number") {
            this._maxTimes = this._minTimes = des;
        }
        else if (t === 'object') {
            if (des.times) {
                this._maxTimes = this._minTimes = des.times;
            }
            else {
                this._maxTimes = des.maxTimes;
                this._minTimes = des.minTimes;
            }
        }
        else {
            if (t === "string")
                this.Token = des;
            this._maxTimes = this._minTimes = 1;
        }
    }
    Regular.prototype.Reset = function () {
        this._repeatedTimes = 0;
        this._isRepeatCheck = false;
        return this;
    };
    Regular.prototype.Match = function (ctx) {
        var input = ctx.input;
        var at = input.at;
        while (true) {
            var rs = this.CheckMatch(input);
            if (rs === RegularMatchResults.Empty || rs === RegularMatchResults.Matched) {
                return {
                    input: input,
                    at: at,
                    length: input.at - at,
                    line: input.line,
                    regular: this
                };
            }
            else if (rs === RegularMatchResults.NotMatch) {
                return null;
            }
            // Uncertain,继续找
            if (input.EOF)
                return;
        }
    };
    Regular.prototype.CheckMatch = function (input) {
        var ch = input.fetech();
        var rs = this.InternalCheck(ch);
        if (rs === RegularMatchResults.Matched) {
            var times = ++this._repeatedTimes;
            this.Reset();
            //如果达到了最大次数
            if (times === this._maxTimes) {
                //重置正则状态，下次匹配从初始状态开始
                return RegularMatchResults.Matched;
            }
            this._repeatedTimes = times;
            //this._repeatedTimes= times;
            return RegularMatchResults.Unkcertain;
        }
        else if (rs === RegularMatchResults.NotMatch || rs === RegularMatchResults.Empty) {
            //把当前字符退回到input去，下一个匹配要用这个字符开始
            input.pushback(ch);
            //获取出当前状态
            var times = this._repeatedTimes;
            if (this._isRepeatCheck) {
                if (times)
                    return RegularMatchResults.Matched;
                return RegularMatchResults.NotMatch;
            }
            //重来都没有匹配上
            if (times === 0) {
                this.Reset();
                return this._minTimes === 0 ? RegularMatchResults.Empty : RegularMatchResults.NotMatch;
            }
            //检查最小匹配次数
            if (times < this._minTimes) {
                this.Reset();
                return RegularMatchResults.NotMatch;
            }
            this.Reset();
            this._repeatedTimes = times;
            this._isRepeatCheck = true;
            return RegularMatchResults.Unkcertain;
        }
        else {
            this._isRepeatCheck = false;
            return RegularMatchResults.Unkcertain;
        }
    };
    Regular.prototype.InternalCheck = function (ch) {
        throw new Error("Abstract method");
    };
    Regular.prototype.toString = function (braced) {
        if (this._minTimes == 0) {
            if (this._maxTimes === 1)
                return "?";
            else if (this._maxTimes) {
                return "{," + this._maxTimes + "}";
            }
            else
                return "*";
        }
        else if (this._minTimes === 1) {
            if (this._maxTimes === 1)
                return "";
            else if (this._maxTimes)
                return "{1," + this._maxTimes + "}";
            else
                return "+";
        }
        else {
            if (this._minTimes === this._maxTimes)
                return "{" + this._minTimes + "}";
            return "{" + this._minTimes + "," + this._maxTimes + "}";
        }
    };
    return Regular;
}());
exports.Regular = Regular;
var CharsetRegular = /** @class */ (function (_super) {
    __extends(CharsetRegular, _super);
    function CharsetRegular(chars, des) {
        var _this = _super.call(this, des) || this;
        if (typeof des === 'boolean')
            _this._navigate = des;
        else if (typeof des === 'object')
            _this._navigate = des.navigate || false;
        _this.Chars = chars;
        if (chars.length === 0)
            throw new Error("必须要指定字符集");
        else if (chars.length === 1) {
            _this._code = chars.charCodeAt(0);
            _this.InternalCheck = _this._CheckChar;
        }
        else if (chars.length === 3 && chars[1] === "-") {
            _this._minCode = chars.charCodeAt(0);
            _this._maxCode = chars.charCodeAt(2);
            _this.InternalCheck = _this._CheckRange;
        }
        else {
            if (chars.length === 4 && chars[1] == "\\" && chars[2] === "-")
                _this.Chars = chars[0] + "-" + chars[3];
            _this.InternalCheck = _this._Check;
        }
        return _this;
    }
    CharsetRegular.prototype._CheckChar = function (ch) {
        if (ch === this._code)
            return this._navigate ? RegularMatchResults.NotMatch : RegularMatchResults.Matched;
        else
            return this._navigate ? RegularMatchResults.Matched : RegularMatchResults.NotMatch;
    };
    CharsetRegular.prototype._CheckRange = function (ch) {
        if (ch >= this._minCode && ch <= this._maxCode)
            return this._navigate ? RegularMatchResults.NotMatch : RegularMatchResults.Matched;
        else
            return this._navigate ? RegularMatchResults.Matched : RegularMatchResults.NotMatch;
    };
    CharsetRegular.prototype._Check = function (ch) {
        for (var i = 0, j = this.Chars.length; i < j; i++) {
            if (this.Chars.charCodeAt(i) === ch) {
                return (this._navigate) ? RegularMatchResults.NotMatch : RegularMatchResults.Matched;
            }
        }
        return (this._navigate) ? RegularMatchResults.Matched : RegularMatchResults.NotMatch;
    };
    CharsetRegular.prototype.toString = function () {
        if (this.InternalCheck === this._CheckChar)
            return "" + (this._navigate ? "^" : "") + this.Chars + _super.prototype.toString.call(this);
        if (this.InternalCheck == this._CheckRange)
            return "[" + (this._navigate ? "^" : "") + this.Chars + "]" + _super.prototype.toString.call(this);
        return "[" + (this._navigate ? "^" : "") + this.Chars.replace(/[\/\-\[\]\{\}\*\+\?\^\\\(\)]/g, "\\$1") + "]" + _super.prototype.toString.call(this);
    };
    return CharsetRegular;
}(Regular));
exports.CharsetRegular = CharsetRegular;
//Lexical 文法生成token
//syntax 生成语法
//semantic 语义 类型检查
//Grammar 语法
