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
    StringTextReader.prototype.fetech = function (handler) {
        var ch;
        if (this.EOF) {
            return RegularMatchResults.NotMatch;
        }
        else {
            ch = this.raw.charCodeAt(this.at++);
            if (ch === 13)
                this.line++;
            if (this.at === this.raw.length)
                this.EOF = true;
        }
        var rs = handler(ch);
        //if(this.EOF){this.at=this.raw.length; return rs;}
        if (rs === RegularMatchResults.Empty || rs === RegularMatchResults.NotMatch) {
            this.at--;
            this.EOF = false;
        }
        return rs;
    };
    StringTextReader.prototype.toString = function () {
        return this.raw;
    };
    return StringTextReader;
}());
exports.StringTextReader = StringTextReader;
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
                this.Reset();
                return {
                    input: input,
                    at: at,
                    length: input.at - at,
                    line: input.line,
                    regular: this
                };
            }
            else if (rs === RegularMatchResults.NotMatch) {
                this.Reset();
                return null;
            }
            // Uncertain,继续找
        }
    };
    Regular.prototype.CheckMatch = function (input) {
        //let ch = input.fetech();
        var rs = this.InternalCheck(input);
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
            //获取出当前状态
            var times = this._repeatedTimes;
            if (this._isRepeatCheck) {
                this.Reset();
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
            //this._isRepeatCheck=false;
            return RegularMatchResults.Unkcertain;
        }
    };
    Regular.prototype.InternalCheck = function (input) {
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
            return "{" + this._minTimes + "," + (this._maxTimes || "") + "}";
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
    CharsetRegular.prototype._CheckChar = function (input) {
        var _this = this;
        return input.fetech(function (ch) {
            if (ch === _this._code)
                return _this._navigate ? RegularMatchResults.NotMatch : RegularMatchResults.Matched;
            else
                return _this._navigate ? RegularMatchResults.Matched : RegularMatchResults.NotMatch;
        });
    };
    CharsetRegular.prototype._CheckRange = function (input) {
        var _this = this;
        return input.fetech(function (ch) {
            if (ch >= _this._minCode && ch <= _this._maxCode)
                return _this._navigate ? RegularMatchResults.NotMatch : RegularMatchResults.Matched;
            else
                return _this._navigate ? RegularMatchResults.Matched : RegularMatchResults.NotMatch;
        });
    };
    CharsetRegular.prototype._Check = function (input) {
        var _this = this;
        return input.fetech(function (ch) {
            for (var i = 0, j = _this.Chars.length; i < j; i++) {
                if (_this.Chars.charCodeAt(i) === ch) {
                    return (_this._navigate) ? RegularMatchResults.NotMatch : RegularMatchResults.Matched;
                }
            }
            return (_this._navigate) ? RegularMatchResults.Matched : RegularMatchResults.NotMatch;
        });
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
var LiteralRegular = /** @class */ (function (_super) {
    __extends(LiteralRegular, _super);
    function LiteralRegular(chars, des) {
        var _this = this;
        if (chars.length == 0)
            throw new Error("不可以输入空字符");
        _this = _super.call(this, des) || this;
        _this.Chars = chars;
        _this._matchAt = 0;
        return _this;
    }
    LiteralRegular.prototype.Reset = function () {
        _super.prototype.Reset.call(this);
        this._matchAt = 0;
        return this;
    };
    LiteralRegular.prototype.InternalCheck = function (input) {
        var _this = this;
        return input.fetech(function (ch) {
            var code = _this.Chars.charCodeAt(_this._matchAt++);
            if (ch === code)
                return _this.Chars.length == _this._matchAt ? RegularMatchResults.Matched : RegularMatchResults.Unkcertain;
            return RegularMatchResults.NotMatch;
        });
    };
    LiteralRegular.prototype.toString = function (braced) {
        var des = _super.prototype.toString.call(this);
        return des ? "(" + this.Chars + ")" + des : this.Chars;
    };
    return LiteralRegular;
}(Regular));
exports.LiteralRegular = LiteralRegular;
var PolyRegular = /** @class */ (function (_super) {
    __extends(PolyRegular, _super);
    function PolyRegular(des) {
        var _this = _super.call(this, des) || this;
        _this.Regulars = [];
        return _this;
    }
    PolyRegular.prototype.Charset = function (chars, des) {
        this.Regulars.push(new CharsetRegular(chars, des));
        return this;
    };
    PolyRegular.prototype.Literal = function (chars, des) {
        this.Regulars.push(new LiteralRegular(chars, des));
        return this;
    };
    return PolyRegular;
}(Regular));
exports.PolyRegular = PolyRegular;
var SequenceRegular = /** @class */ (function (_super) {
    __extends(SequenceRegular, _super);
    function SequenceRegular(des) {
        var _this = _super.call(this, des) || this;
        _this._stepAt = 0;
        return _this;
    }
    SequenceRegular.prototype.Reset = function () {
        this._stepAt = 0;
        for (var i in this.Regulars)
            this.Regulars[i].Reset();
        return _super.prototype.Reset.call(this);
    };
    SequenceRegular.prototype.InternalCheck = function (input) {
        var regular = this.Regulars[this._stepAt];
        var rs = regular.CheckMatch(input);
        if (rs === RegularMatchResults.Matched || rs === RegularMatchResults.Empty) {
            if (this._stepAt == this.Regulars.length - 1)
                return RegularMatchResults.Matched;
            this._stepAt++;
            return RegularMatchResults.Unkcertain;
        }
        else
            return rs;
    };
    SequenceRegular.prototype.optional = function (builder, des) {
        var optional = new OptionalRegular(des);
        this.Regulars.push(optional);
        builder(optional);
        return this;
    };
    SequenceRegular.prototype.toString = function (braced) {
        var str = "";
        for (var i in this.Regulars) {
            var s = this.Regulars[i];
            if (s instanceof OptionalRegular)
                str += "(" + s.toString() + ")";
            else
                str += s.toString();
        }
        var des = _super.prototype.toString.call(this);
        if (des)
            return "(" + str + ")" + des;
        return str;
    };
    return SequenceRegular;
}(PolyRegular));
exports.SequenceRegular = SequenceRegular;
var OptionalRegular = /** @class */ (function (_super) {
    __extends(OptionalRegular, _super);
    function OptionalRegular(des) {
        return _super.call(this, des) || this;
    }
    OptionalRegular.prototype.Reset = function () {
        this._liveRegulars = undefined;
        this._emptyRegular = undefined;
        for (var i in this.Regulars) {
            this.Regulars[i].Reset();
        }
        return _super.prototype.Reset.call(this);
    };
    OptionalRegular.prototype.sequence = function (builder, des) {
        var seq = new SequenceRegular(des);
        this.Regulars.push(seq);
        builder(seq);
        return this;
    };
    OptionalRegular.prototype.InternalCheck = function (input) {
        var livedRegulars = this._liveRegulars;
        if (!livedRegulars) {
            livedRegulars = this._liveRegulars = [];
            for (var i in this.Regulars)
                livedRegulars.push(this.Regulars[i]);
        }
        for (var i = 0, j = livedRegulars.length; i < j; i++) {
            var regular = livedRegulars.shift();
            var rs = regular.CheckMatch(input);
            if (rs === RegularMatchResults.Unkcertain) {
                livedRegulars.push(regular);
            }
            else if (rs === RegularMatchResults.Empty) {
                if (!this._emptyRegular)
                    this._emptyRegular = regular;
            }
            else if (rs === RegularMatchResults.Matched) {
                return rs;
            }
        }
        if (livedRegulars.length === 0) {
            return this._emptyRegular ? RegularMatchResults.Empty : RegularMatchResults.NotMatch;
        }
        return RegularMatchResults.Unkcertain;
    };
    OptionalRegular.prototype.toString = function (braced) {
        var str = "";
        for (var i in this.Regulars) {
            var s = this.Regulars[i];
            if (s instanceof SequenceRegular)
                str += "(" + s.toString() + ")";
            else
                str += s.toString();
        }
        var des = _super.prototype.toString.call(this);
        if (des)
            return "(" + str + ")" + des;
        return str;
    };
    return OptionalRegular;
}(PolyRegular));
exports.OptionalRegular = OptionalRegular;
//Lexical 文法生成token
//syntax 生成语法
//semantic 语义 类型检查
//Grammar 语法
