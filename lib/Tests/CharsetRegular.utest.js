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
var YA_syntax_1 = require("../YA.syntax");
var UnittestError = /** @class */ (function (_super) {
    __extends(UnittestError, _super);
    function UnittestError(msg, outerMessage) {
        var _this = _super.call(this, msg) || this;
        _this.outerMessage = outerMessage;
        return _this;
    }
    UnittestError.prototype.toString = function () {
        if (this.outerMessage)
            return this.outerMessage;
        return _super.prototype.toString.call(this);
    };
    return UnittestError;
}(Error));
exports.UnittestError = UnittestError;
var Unittest = /** @class */ (function () {
    function Unittest(name, logger) {
        this.$NAME = name;
        this._$members = {};
        this._$errors = [];
        if (!logger)
            logger = {
                info: function (msg) { return console.info(msg); },
                error: function (msg, err) { return console.error(msg, err); },
                assert: function (cond, msg) { return console.assert(cond, msg); },
                warn: function (msg) { return console.warn(msg); },
                beginGroup: function (title) { return console.group(title); },
                endGroup: function () { return console.groupEnd(); }
            };
        this._$logger = logger;
    }
    Unittest.prototype.$RUN = function (target) {
        var _this = this;
        if (!target)
            target = this;
        if (typeof target === "function")
            target = new target();
        var count = 0;
        this._$logger.beginGroup("{" + this.$NAME + "}");
        var assert = function (actual, expected, msg, paths) {
            if (!paths && msg)
                msg = msg.replace(/\{actual\}/g, JSON.stringify(actual)).replace(/\{expected\}/g, JSON.stringify(expected));
            if (actual === expected) {
                if (!Unittest.hiddenSteps && msg && !paths) {
                    _this._$logger.info(msg);
                }
                return;
            }
            var t = typeof (expected);
            if (t === "object") {
                paths || (paths = []);
                //let nullMsg = msg || "期望有值";
                if (!actual)
                    throw new UnittestError(paths.join(".") + "不应为空.", msg);
                for (var n in expected) {
                    paths.push(n);
                    var expectedValue = expected[n];
                    var actualValue = actual[n];
                    if (typeof expectedValue === "object") {
                        assert(actualValue, expectedValue, msg, paths);
                    }
                    else {
                        if (actualValue !== expectedValue) {
                            throw new UnittestError(paths.join(".") + "\u671F\u671B\u503C\u4E3A" + expectedValue + ",\u5B9E\u9645\u4E3A" + actualValue, msg);
                        }
                    }
                    paths.pop();
                }
                if (!Unittest.hiddenSteps && msg && !paths.length) {
                    _this._$logger.info(msg);
                }
            }
            else if (actual !== expected) {
                throw new UnittestError(paths.join(".") + "\u671F\u671B\u503C\u4E3A" + actual + ",\u5B9E\u9645\u4E3A" + expected, msg);
            }
            else {
                if (!Unittest.hiddenSteps && msg && !paths) {
                    _this._$logger.info(msg);
                }
            }
        };
        var info = function (msg, expected) {
            msg = msg.replace(/\{variable\}/g, JSON.stringify(expected));
            _this._$logger.info(msg);
        };
        for (var name_1 in target) {
            if (name_1 === "$RUN" || name_1 === "$NAME")
                continue;
            var fn = target[name_1];
            if (typeof fn !== "function")
                continue;
            this._$logger.beginGroup("(" + name_1 + ")");
            var ex = undefined;
            try {
                count++;
                fn.call(target, assert, info);
                this._$members[name_1] = true;
            }
            catch (ex) {
                this._$members[name_1] = false;
                var msg = ex.outerMessage || ex.toString();
                this._$errors.push({
                    Message: msg,
                    Exception: ex,
                    Name: name_1
                });
                this._$logger.error(msg, ex);
            }
            this._$logger.endGroup();
        }
        this._$errors.length ? this._$logger.warn("\u7ED3\u675F\u6D4B\u8BD5{" + this.$NAME + "},\u9519\u8BEF\u7387:" + this._$errors.length + "/" + count + "=" + this._$errors.length * 100 / count + "%.") : this._$logger.info("\u7ED3\u675F\u6D4B\u8BD5{" + this.$NAME + "},\u9519\u8BEF\u7387:" + this._$errors.length + "/" + count + "=0%..");
        this._$logger.endGroup();
        return this._$errors;
    };
    Unittest.Test = function (name, target) {
        if (target === undefined) {
            target = name;
            name = undefined;
        }
        var utest = new Unittest(name);
        utest.$RUN(target);
        return utest;
    };
    return Unittest;
}());
exports.Unittest = Unittest;
Unittest.Test("CharsetRegular", {
    "Charset": function (assert, info) {
        var reg = new YA_syntax_1.CharsetRegular("A");
        var expected = { at: 0, length: 1 };
        var ctx = new YA_syntax_1.RegularContext("Abc");
        var rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5355\u4E00\u5B57\u7B26\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("abc");
        rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5355\u4E00\u5B57\u7B26\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")===={expected}");
        //-----------------------------
        reg = new YA_syntax_1.CharsetRegular("ACF");
        ctx = new YA_syntax_1.RegularContext("aDE");
        rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5B57\u7B26\u96C6\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("BCF");
        rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5B57\u7B26\u96C6\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("Abc");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5B57\u7B26\u96C6\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("Cbc");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5B57\u7B26\u96C6\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("Fbc");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5B57\u7B26\u96C6\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        reg = new YA_syntax_1.CharsetRegular("A-F");
        ctx = new YA_syntax_1.RegularContext("abc");
        //info(`/${reg}/.match("${ctx}")==={expected}`);
        rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5B57\u7B26\u8303\u56F4\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("Abc");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5B57\u7B26\u8303\u56F4\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("Dbc");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5B57\u7B26\u8303\u56F4\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
    },
    "Nagative": function (assert, info) {
        var reg = new YA_syntax_1.CharsetRegular("A", true);
        var ctx = new YA_syntax_1.RegularContext("Abc");
        var expected = { at: 0, length: 1 };
        var rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5355\u4E00\u5B57\u7B26\u975E\u96C6\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("abc");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5355\u4E00\u5B57\u7B26\u975E\u96C6\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("Fbc");
        rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5B57\u7B26\u96C6\u5408\u975E\u96C6\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        reg = new YA_syntax_1.CharsetRegular("AF", true);
        ctx = new YA_syntax_1.RegularContext("Abc");
        rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5B57\u7B26\u96C6\u5408\u975E\u96C6\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("abc");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5B57\u7B26\u96C6\u5408\u975E\u96C6\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        reg = new YA_syntax_1.CharsetRegular("A-F", true);
        ctx = new YA_syntax_1.RegularContext("Dbc");
        rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u8303\u56F4\u96C6\u5408\u975E\u96C6\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("abc");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u8303\u56F4\u96C6\u5408\u975E\u96C6\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
    },
    "Repeat": function (assert) {
        var expected = { at: 0, length: 3 };
        var reg = new YA_syntax_1.CharsetRegular("A-C", 3);
        var ctx = new YA_syntax_1.RegularContext("BCAbc");
        var rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5927\u4E8Emax\u7684:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        reg = new YA_syntax_1.CharsetRegular("A", 3);
        ctx = new YA_syntax_1.RegularContext("Abc");
        rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5C0F\u4E8Emin\u7684:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        reg = new YA_syntax_1.CharsetRegular("ADE", { minTimes: 1, maxTimes: 3, navigate: true });
        ctx = new YA_syntax_1.RegularContext("rrAEs");
        expected.length = 2;
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5min,max\u4E2D\u95F4\u7684:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        reg = new YA_syntax_1.CharsetRegular("A", { minTimes: 1 });
        ctx = new YA_syntax_1.RegularContext("AAA");
        expected.length = 3;
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5*\u5230EOF:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
    },
    "Literal": function (assert) {
        var expected = { at: 0, length: 5 };
        var reg = new YA_syntax_1.LiteralRegular("Hello");
        var ctx = new YA_syntax_1.RegularContext("Hallo,Yi.");
        var rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5B57\u7B26\u4E32\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext("Hello,Yi.");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5B57\u7B26\u4E32\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        reg = new YA_syntax_1.LiteralRegular("Hello", { minTimes: 1, maxTimes: 3 });
        ctx = new YA_syntax_1.RegularContext("HelloHelloHelloHello.");
        expected = { at: 0, length: 15 };
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5B57\u7B26\u4E32\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
    },
    "Sequence": function (assert) {
        var expected = { at: 0, length: 3 };
        var reg = new YA_syntax_1.SequenceRegular();
        reg.Charset("1-9", { minTimes: 0 }).Literal(",").Charset("abc", { minTimes: 1 });
        var ctx = new YA_syntax_1.RegularContext("1,d");
        var rs = reg.Match(ctx);
        assert(rs, null, "\u6D4B\u8BD5\u5E8F\u5217\u4E0D\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        ctx = new YA_syntax_1.RegularContext(",bb");
        rs = reg.Match(ctx);
        assert(rs, expected, "\u6D4B\u8BD5\u5E8F\u5217\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
        reg = new YA_syntax_1.SequenceRegular({ minTimes: 2 });
        reg.Charset("1-9", { minTimes: 0 }).Literal(",q").Charset("abc", { minTimes: 1 });
        ctx = new YA_syntax_1.RegularContext(",qbb21,qc,qca4,qbq");
        rs = reg.Match(ctx);
        assert(rs, { at: 0, length: 17 }, "\u6D4B\u8BD5\u5E8F\u5217\u5339\u914D:/" + reg + "/.match(\"" + ctx + "\")=={expected}");
    },
    "optional": function (assert) {
        var reg = new YA_syntax_1.OptionalRegular();
        reg.Charset("1-9", { minTimes: 0 }).Literal(",x").Charset("abc", { minTimes: 1 });
        var ctx = new YA_syntax_1.RegularContext("1,d");
    }
});
