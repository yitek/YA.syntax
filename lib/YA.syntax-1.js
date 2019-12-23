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
//
// 期望这些代码可以转成c语言
// 其核心代码是c语言风格
//
var YA1;
(function (YA1) {
    var Lexical1;
    (function (Lexical1) {
        /**
         * 字符串类型的文本阅读器
         *
         * @export
         * @class StringTextReader
         * @implements {ITextReader}
         */
        var StringTextReader = /** @class */ (function () {
            function StringTextReader(input, endChar) {
                this.Input = input;
                this.At = 0;
                this.Line = 0;
                this.EndChar = endChar || 0;
            }
            /**
             * 获取下一个字符
             *
             * @returns {number}
             * @memberof ITextReader
             */
            StringTextReader.prototype.NextChar = function () {
                if (this._pushedbackChar) {
                    var ch_1 = this._pushedbackChar;
                    this._pushedbackChar = undefined;
                    return ch_1;
                }
                if (this.At >= this.Input.length)
                    return this.EndChar;
                var ch = this.Input.charCodeAt(this.At++);
                if (ch === 13)
                    this.Line++;
                return ch;
            };
            StringTextReader.prototype.Pushback = function (ch) {
                if (this._pushedbackChar === undefined)
                    throw new Error("已经有一个Pushback字符了，不允许再pushback.");
                if (ch === this.EndChar)
                    throw new Error("不允许Pushback终结符");
                this._pushedbackChar = ch;
                return this;
            };
            return StringTextReader;
        }());
        Lexical1.StringTextReader = StringTextReader;
        var MatchResults;
        (function (MatchResults) {
            /**
             * 不匹配
             */
            MatchResults[MatchResults["NotMatch"] = 0] = "NotMatch";
            /**
             * 已匹配
             */
            MatchResults[MatchResults["Matched"] = 1] = "Matched";
            /**
             * 没有不匹配，但已经结束
             */
            MatchResults[MatchResults["End"] = 2] = "End";
            /**
             * 匹配到了空字符
             */
            MatchResults[MatchResults["Empty"] = 3] = "Empty";
        })(MatchResults = Lexical1.MatchResults || (Lexical1.MatchResults = {}));
        /* 文法规则
        *
        * @export
        * @class Lexical
        */
        var Regular = /** @class */ (function () {
            function Regular(_des) {
                if (_des instanceof Regular) {
                    this._min = _des._min;
                    this._max = _des._max;
                    this._token = _des._token;
                    return this;
                }
                if (typeof _des === "number") {
                    this.Repeat(_des);
                    return this;
                }
                var des = _des;
                if (des) {
                    if (des.Min !== undefined) {
                        if (des.Max) {
                            this.Repeat(des.Min, des.Max);
                        }
                        else
                            this.MinRepeat(des.Min);
                    }
                    else {
                        if (des.Max !== undefined) {
                            this.MaxRepeat(des.Max);
                        }
                        else {
                            if (des.Repeat)
                                this.Repeat(des.Repeat);
                        }
                    }
                }
                else {
                    this._min = this._max = 1;
                }
            }
            Regular.prototype.Descriptor = function (value) {
                if (value === undefined)
                    return { Min: this._min, Max: this._max, Token: this._token };
                this._min = value.Min;
                this._max = value.Max;
                this._token = value.Token;
                if (value.Repeat !== undefined) {
                    this._max = this._min = value.Repeat;
                }
                return this;
            };
            Regular.prototype.Repeat = function (minOrCount, max) {
                if (max === undefined) {
                    this._max = this._min = minOrCount;
                    return this;
                }
                this._min = minOrCount;
                this._max = max;
                return this;
            };
            Regular.prototype.MinRepeat = function (min) {
                this._min = min;
                this._max = undefined;
                return this;
            };
            Regular.prototype.MaxRepeat = function (max) {
                this._max = max;
                this._min = 0;
                return this;
            };
            Regular.prototype.Replace = function (name, referred) {
                return this;
            };
            /**
             * 重置规则的内部状态，让Match从头开始
             *
             * @returns {Regular}
             * @memberof Regular
             */
            Regular.prototype.Reset = function () { return this; };
            Regular.prototype.Match = function (context) {
                var reader = context.Input;
                var start = reader.At;
                var matchCount = 0;
                while (true) {
                    var ch = reader.NextChar();
                    var matchResult = this.InternalMatch(ch, context);
                    if (matchResult === MatchResults.End) {
                        reader.Pushback(ch);
                        matchCount++;
                        if (matchCount >= this._min && this._max && matchCount == this._max) {
                            return {
                                Input: reader,
                                At: start,
                                Length: reader.At - start,
                                Line: reader.Line,
                                Regular: this
                            };
                        }
                        this.Reset();
                    }
                    else if (matchResult === MatchResults.NotMatch) {
                        return;
                    }
                    else if (matchResult === MatchResults.Empty) {
                        //遇到空，必须跳出循环，否则每次都会匹配空字符串
                        //空字符串不算一次match所有没有matchCount++;
                        if (matchCount >= this._min && this._max && matchCount == this._max) {
                            return {
                                Input: reader,
                                At: start,
                                Length: reader.At - start,
                                Line: reader.Line,
                                Regular: this
                            };
                        }
                        return;
                    }
                    //如果遇到结束符号，任何匹配都不成立
                    if (ch === reader.EndChar)
                        null;
                }
            };
            /**
             * 供子类override的函数
             *
             * @protected
             * @param {number} ch
             * @param {number} currentAt
             * @returns {boolean}
             * @memberof Regular
             */
            Regular.prototype.InternalMatch = function (ch, context) {
                throw new Error("Abstract method");
            };
            Regular.prototype.Clone = function (deep) {
                return new Regular(this);
            };
            Regular.prototype.toString = function (braced) {
                if (this._min == 0) {
                    if (this._max === 1)
                        return "?";
                    else if (this._max) {
                        return "{," + this._max + "}";
                    }
                    else
                        return "*";
                }
                else if (this._min === 1) {
                    if (this._max === 1)
                        return "";
                    else if (this._max)
                        return "{1," + this._max + "}";
                    else
                        return "+";
                }
                else {
                    if (this._min === this._max)
                        return "{" + this._min + "}";
                    return "{" + this._min + "," + this._max + "}";
                }
            };
            return Regular;
        }());
        Lexical1.Regular = Regular;
        var EmptyRegular = /** @class */ (function (_super) {
            __extends(EmptyRegular, _super);
            function EmptyRegular() {
                return _super.call(this) || this;
            }
            EmptyRegular.prototype.Match = function (context) {
                return {
                    Input: context.Input,
                    At: context.Input.At,
                    Line: context.Input.Line,
                    Length: 0,
                    Regular: this
                };
            };
            EmptyRegular.prototype.InternalMatch = function (ch, context) {
                return MatchResults.Empty;
            };
            EmptyRegular.prototype.Clone = function () { return this; };
            EmptyRegular.prototype.Replace = function (name, reg) { return this; };
            EmptyRegular.prototype.toString = function () {
                return "ε";
            };
            EmptyRegular.value = new EmptyRegular();
            return EmptyRegular;
        }(Regular));
        Lexical1.EmptyRegular = EmptyRegular;
        Lexical1.emptyRegular = EmptyRegular.value;
        var CharsetRegular = /** @class */ (function (_super) {
            __extends(CharsetRegular, _super);
            function CharsetRegular(chars, des) {
                var _this = this;
                if (chars instanceof CharsetRegular) {
                    _this = _super.call(this, chars) || this;
                    _this.Chars = chars.Chars;
                    _this._maxCode = chars._maxCode;
                    _this._minCode = chars._minCode;
                    _this._nagative = chars._nagative;
                    return;
                }
                if (typeof des === "boolean") {
                    _this = _super.call(this) || this;
                    _this._nagative = des;
                    _this._InitChars(chars);
                }
                else {
                    _this = _super.call(this, des) || this;
                    _this._InitChars(chars);
                }
                return _this;
            }
            CharsetRegular.prototype._InitChars = function (chars) {
                if (chars.length == 3 && chars[1] === "-") {
                    this._minCode = chars.charCodeAt(0);
                    this._maxCode = chars.charCodeAt(2);
                    this.Chars = chars;
                    return this;
                }
                if (chars.length === 4 && chars[1] == "\\" && chars[2] === "-") {
                    this.Chars = chars[0] + "-" + chars[3];
                }
            };
            CharsetRegular.prototype.Nagative = function (value) {
                if (value === undefined)
                    return this._nagative;
                this._nagative = value;
                return this;
            };
            CharsetRegular.prototype.InternalMatch = function (ch, context) {
                for (var i = 0, j = this.Chars.length; i < j; i++) {
                    var c = this.Chars.charCodeAt(i);
                    if (c === ch)
                        return this.Nagative ? MatchResults.NotMatch : MatchResults.End;
                }
                return this.Nagative ? MatchResults.End : MatchResults.NotMatch;
            };
            CharsetRegular.prototype.Clone = function () {
                return new CharsetRegular(this);
            };
            CharsetRegular.prototype.Descriptor = function (value) {
                if (value === undefined)
                    return { Min: this._min, Max: this._max, Token: this._token, Navigate: this._nagative };
                _super.prototype.Descriptor.call(this, value);
                return this;
            };
            CharsetRegular.prototype.toString = function (braced) {
                var str = "[" + (this._nagative ? '^' : '') + this.Chars.replace(/\\+-\{\}\[\]\?\^\|\$/g, "\\$0") + "]" + _super.prototype.toString.call(this);
                return braced ? "(" + str + ")" : str;
            };
            return CharsetRegular;
        }(Regular));
        Lexical1.CharsetRegular = CharsetRegular;
        var LiteralRegular = /** @class */ (function (_super) {
            __extends(LiteralRegular, _super);
            function LiteralRegular(chars, des) {
                var _this = this;
                if (chars instanceof LiteralRegular) {
                    _this = _super.call(this, chars) || this;
                    _this.Chars = chars.Chars;
                    return;
                }
                _this = _super.call(this, des) || this;
                _this.Chars = chars;
                return _this;
            }
            LiteralRegular.prototype.toString = function (braced) {
                return this.Chars;
            };
            return LiteralRegular;
        }(Regular));
        Lexical1.LiteralRegular = LiteralRegular;
        var EndRegular = /** @class */ (function (_super) {
            __extends(EndRegular, _super);
            function EndRegular(chars, des) {
                return _super.call(this, chars, des) || this;
            }
            EndRegular.prototype.toString = function () {
                return "$";
            };
            return EndRegular;
        }(CharsetRegular));
        Lexical1.EndRegular = EndRegular;
        var PlaceholderRegular = /** @class */ (function (_super) {
            __extends(PlaceholderRegular, _super);
            function PlaceholderRegular(name, token) {
                var _this = _super.call(this) || this;
                _this.Name = name;
                _this.Token = token;
                return _this;
            }
            PlaceholderRegular.prototype.InternalMatch = function (ch, context) {
                var reg = context.findRegular(this.Name);
                return reg.InternalMatch(ch, context);
            };
            PlaceholderRegular.prototype.Replace = function (name, referred) {
                //if(this.Name==name) return referred;
                return this;
            };
            PlaceholderRegular.prototype.Clone = function (deep) { return this; };
            PlaceholderRegular.prototype.toString = function () {
                if (this.Token) {
                    if (this.Name) {
                        return "<#" + this.Token + "#>(<&" + this.Name + "&>)";
                    }
                    else {
                        var str = this.InnerRegular.toString();
                    }
                }
            };
            return PlaceholderRegular;
        }(Regular));
        Lexical1.PlaceholderRegular = PlaceholderRegular;
        var ComposedRegular = /** @class */ (function (_super) {
            __extends(ComposedRegular, _super);
            function ComposedRegular(regsOrIns, des) {
                var _this = this;
                if (regsOrIns instanceof ComposedRegular) {
                    _this = _super.call(this, regsOrIns) || this;
                    var regs = _this.Regulars = [];
                    for (var i in regsOrIns.Regulars) {
                        regs.push(des ? regsOrIns.Regulars[i].Clone() : regsOrIns.Regulars[i]);
                    }
                    return _this;
                }
                if (regsOrIns && regsOrIns.length && regsOrIns.push) {
                    _this = _super.call(this, des) || this;
                    _this.Regulars = regsOrIns;
                    return _this;
                }
                _this = _super.call(this, regsOrIns) || this;
                _this.Regulars = [];
                return _this;
            }
            ComposedRegular.prototype.Replace = function (name, referred) {
                throw new Error("Invalid Program.");
            };
            ComposedRegular.prototype.Reset = function () {
                for (var i in this.Regulars) {
                    this.Regulars[i].Reset();
                }
                return this;
            };
            ComposedRegular.prototype.Clone = function (deep) {
                return new ComposedRegular(this);
            };
            ComposedRegular.prototype.Append = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                for (var i = 0, j = arguments.length; i < j; i++) {
                    this.Regulars.push(arguments[i]);
                }
                return this;
            };
            ComposedRegular.prototype.Charset = function (chars, des) {
                var reg = new CharsetRegular(chars, des);
                this.Regulars.push(reg);
                return this;
            };
            ComposedRegular.prototype.Literal = function (chars, des) {
                var reg = new LiteralRegular(chars, des);
                this.Regulars.push(reg);
                return this;
            };
            ComposedRegular.prototype.Sequence = function (builder, des) {
                var reg = new SequenceRegular(des);
                builder(reg);
                this.Regulars.push(reg);
                return this;
            };
            ComposedRegular.prototype.Optional = function (builder, des) {
                var reg = new OptionalRegular(des);
                builder(reg);
                this.Regulars.push(reg);
                return this;
            };
            return ComposedRegular;
        }(Regular));
        Lexical1.ComposedRegular = ComposedRegular;
        var SequenceRegular = /** @class */ (function (_super) {
            __extends(SequenceRegular, _super);
            function SequenceRegular(regs, des) {
                var _this = _super.call(this, regs, des) || this;
                _this._ruleAt = 0;
                return _this;
            }
            SequenceRegular.prototype.Reset = function () {
                this._ruleAt = 0;
                this._currentLRegular = this.Regulars[0];
                this._hasMatch = false;
                return _super.prototype.Reset.call(this);
            };
            /**
             * 排除空字符串
             *
             * @param {...Regular[]} args
             * @returns {ComposedRegular}
             * @memberof SequenceRegular
             */
            SequenceRegular.prototype.Append = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                for (var i = 0, j = arguments.length; i < j; i++) {
                    var reg = arguments[i];
                    if (reg instanceof EmptyRegular)
                        continue;
                    this.Regulars.push(reg);
                }
                return this;
            };
            SequenceRegular.prototype.InternalMatch = function (ch, context) {
                if (this.Regulars.length == 0)
                    return MatchResults.Empty;
                if (this.Regulars.length == 1)
                    return this.Regulars[0].InternalMatch(ch, context);
                while (true) {
                    if (!this._currentLRegular)
                        return this._hasMatch ? MatchResults.End : MatchResults.Empty;
                    var rs = this._currentLRegular.InternalMatch(ch, context);
                    if (rs == MatchResults.Matched)
                        return MatchResults.Matched;
                    if (rs == MatchResults.NotMatch)
                        return MatchResults.NotMatch;
                    if (rs == MatchResults.End) {
                        this._currentLRegular = this.Regulars[this._ruleAt++];
                        this._hasMatch = true;
                    }
                    else if (rs === MatchResults.Empty) {
                        this._currentLRegular = this.Regulars[this._ruleAt++];
                    }
                }
            };
            SequenceRegular.prototype.Clone = function () {
                return new SequenceRegular(this);
            };
            SequenceRegular.prototype.toString = function (braced) {
                if (this.Regulars.length == 0)
                    return "";
                var str = "";
                for (var i in this.Regulars) {
                    var rule = this.Regulars[i];
                    str += rule.toString();
                }
                var times = _super.prototype.toString.call(this);
                if (times)
                    str = "(" + str + ")" + times;
                return braced ? "{" + str + "}" : str;
            };
            return SequenceRegular;
        }(ComposedRegular));
        Lexical1.SequenceRegular = SequenceRegular;
        var OptionalRegular = /** @class */ (function (_super) {
            __extends(OptionalRegular, _super);
            function OptionalRegular(regs, des) {
                return _super.call(this, regs, des) || this;
            }
            OptionalRegular.prototype.Reset = function () {
                this._notCompletedLRegulars = null;
                return _super.prototype.Reset.call(this);
            };
            OptionalRegular.prototype.Clone = function () {
                return new OptionalRegular(this);
            };
            OptionalRegular.prototype.Append = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var lastIsEmpty = this.Regulars.pop();
                if (!(lastIsEmpty instanceof EmptyRegular)) {
                    this.Regulars.push(lastIsEmpty);
                    lastIsEmpty = undefined;
                }
                for (var i = 0, j = arguments.length; i < j; i++) {
                    var reg = arguments[i];
                    if (reg instanceof EmptyRegular) {
                        if (!lastIsEmpty)
                            lastIsEmpty = reg;
                        continue;
                    }
                    this.Regulars.push(arguments[i]);
                }
                if (lastIsEmpty)
                    this.Regulars.push(lastIsEmpty);
                return this;
            };
            OptionalRegular.prototype.InternalMatch = function (ch, context) {
                if (this.Regulars.length == 0)
                    return MatchResults.Empty;
                if (this.Regulars.length == 1)
                    return this.Regulars[0].InternalMatch(ch, context);
                if (!this._notCompletedLRegulars) {
                    this._notCompletedLRegulars = [];
                    for (var i in this.Regulars)
                        this._notCompletedLRegulars.push(this.Regulars[i]);
                }
                for (var i = 0, j = this._notCompletedLRegulars.length; i < j; i++) {
                    var rule = this._notCompletedLRegulars.shift();
                    var rs = rule.InternalMatch(ch, context);
                    if (rs === MatchResults.End)
                        return rs;
                    if (rs === MatchResults.NotMatch)
                        continue;
                    this._notCompletedLRegulars.push(rule);
                }
                return this._notCompletedLRegulars.length == 0 ? MatchResults.NotMatch : MatchResults.Matched;
            };
            OptionalRegular.prototype.toString = function (braced) {
                if (this.Regulars.length == 0)
                    return "";
                var str = "";
                for (var i in this.Regulars) {
                    var rule = this.Regulars[i];
                    if (str)
                        str += "|";
                    str += rule.toString();
                }
                var rep = _super.prototype.toString.call(this);
                if (rep)
                    str = "(" + str + ")" + rep;
                return braced ? "(" + str + ")" : str;
            };
            return OptionalRegular;
        }(ComposedRegular));
        Lexical1.OptionalRegular = OptionalRegular;
        var Lexical = /** @class */ (function () {
            function Lexical(grammer, name, reg) {
                this.Name = name;
                this._Grammer = grammer;
                (this.Regular = reg || new OptionalRegular(1)).Append(EmptyRegular.value);
                //if(this.Regular.Regulars)
            }
            Lexical.prototype.Charset = function (chars, des) {
                var reg = new CharsetRegular(chars, des);
                this._Current.Append(reg);
                return this;
            };
            Lexical.prototype.Literal = function (chars, des) {
                var reg = new LiteralRegular(chars, des);
                this._Current.Append(reg);
                return this;
            };
            Lexical.prototype.Reference = function (name, token) {
                var reg = new PlaceholderRegular(name, token);
                this._Current.Append(reg);
                return this;
            };
            Lexical.prototype.Optional = function () {
                this._Current = new SequenceRegular(1);
                this.Regular.Append(this._Current);
                return this;
            };
            Lexical.prototype.Replace = function (referred) {
                var me_optionals = this.Regular.Regulars;
                var ref_optionals = referred.Regular.Regulars;
                //(eAb|d|cA)REP(1|2) = e(1|2)b|d|c(1|2)=e1b|e2b|d|c1|c2
                //(eAb|d|c?A)+REP(1|2)+ = e(1|2)+b|d|c?(1|2)+=e1b|e2b|d|c1|c2
                // (G|H+)*REP H->(I|J)+ = (G|((I|J)+)+)
                for (var i = 0, j = me_optionals.length; i < j; i++) {
                    var me_branch = me_optionals.shift();
                    var me_branch_items = me_branch.Regulars;
                    for (var m = 0, n = ref_optionals.length; m < n; m++) {
                        var ref_branch = ref_optionals[m];
                        var ref_branch_items = ref_branch.Regulars;
                        var new_branch_items = [];
                        for (var n_1 = 0, m_1 = me_branch_items.length; n_1 < m_1; n_1++) {
                            var me_item = me_branch_items[i];
                            if (!(me_item instanceof PlaceholderRegular) || me_item.Name !== referred.Name) {
                                new_branch_items.push(me_item);
                                continue;
                            }
                            // (G|H+)*REP H->(I|J)+ = (G|((I|J)+)+)
                            var me_des = me_item.Descriptor();
                            for (var s in ref_branch_items) {
                                var ref_item = ref_branch_items[s];
                                var ref_des = ref_item.Descriptor();
                                me_des.Min *= ref_des.Min;
                                me_des.Max *= ref_des.Max;
                                var item = ref_item.Clone().Descriptor(me_des);
                                new_branch_items.push(item);
                            }
                        }
                        me_optionals.push(new SequenceRegular(new_branch_items));
                    }
                }
                return this;
            };
            /**
             * 直接左递归: A -> Aa | b
             * 消除方法:   A -> aA' | bA'
                A'-> aA' | ~
    
                1、把所有产生式写成候选式形式。如A→Aa1｜Aa2……｜Aan｜b1｜b2……｜bm。其中每个a都不等于ε，而每个b都不以A开头。
        2、变换候选式成如下形式：
             A→b1A’｜b2A’……｜bmA’
             A’ →a1A’｜a2A’……｜anA’｜ε
             *
             * @param {ILexicalContext} context
             * @returns {Lexical}
             * @memberof Lexical
             */
            Lexical.prototype.Eliminate = function () {
                var branchs = [];
                if (!(this.Regular instanceof OptionalRegular)) {
                    branchs = [this.Regular, EmptyRegular.value];
                }
                else
                    branchs = this.Regular.Regulars;
                //A→Aa1｜Aa2……｜Aan｜b1｜b2……｜bm。其中每个a都不等于ε，而每个b都不以A开头
                var extRegular = new OptionalRegular(1);
                for (var i = 0, j = branchs.length; i < j; i++) {
                    var branch = branchs.shift();
                    if (branch.Regulars[0] === this.Regular) {
                        if (branch.Regulars.length == 1)
                            throw new Error("循环定义的文法");
                        //Aa1 => a1A'
                        var extReg = branch.Clone();
                        extReg.Regulars.shift();
                        extReg.Regulars.push(extReg);
                        extRegular.Regulars.push(extReg);
                    }
                    else {
                        branchs.push(branch);
                    }
                }
                //没有直接左递归，什么都不做
                if (!extRegular.Regulars.length)
                    return this;
                //branchs中剩下的都是不以A开头的
                for (var i in branchs) {
                    // A→b1A’｜b2A’……｜bmA’
                    branchs[i].Append(extRegular);
                }
                this._Grammer.Define(this.Name + "'", extRegular);
            };
            return Lexical;
        }());
        Lexical1.Lexical = Lexical;
        /**
         * 文法
         *
         * @export
         * @class Grammer
         */
        var Grammer = /** @class */ (function () {
            function Grammer() {
            }
            Grammer.prototype.Define = function (name, reg) {
                var existed = this._Names[name];
                if (!existed) {
                    existed = this._Names[name] = new Lexical(this, name, reg);
                    this._Lexicals.push(existed);
                }
                return existed;
            };
            Grammer.prototype.Eliminate = function () {
                //消除左递归
                for (var i = 0, m = this._Lexicals.length; i < m; i++) {
                    for (var j = 0; j < i; j++) {
                        var lexical_i = this._Lexicals[i];
                        var lexical_j = this._Lexicals[j];
                        lexical_i.Replace(lexical_j);
                        lexical_i.Eliminate();
                    }
                }
            };
            return Grammer;
        }());
        Lexical1.Grammer = Grammer;
        //Lexical 文法生成token
        //syntax 生成语法
        //semantic 语义 类型检查
        //Grammar 语法
    })(Lexical1 || (Lexical1 = {}));
})(YA1 || (YA1 = {}));
