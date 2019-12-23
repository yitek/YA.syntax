//
// 期望这些代码可以转成c语言
// 其核心代码是c语言风格
//
namespace YA1 {namespace Lexical1{

    /**
     * 文本阅读器
     *
     * @export
     * @interface ITextReader
     */
    export interface ITextReader{

        /**
         * 当前字符位置
         *
         * @type {number}
         * @memberof ITextReader
         */
        At:number;

        /**
         * 当前行
         *
         * @type {number}
         * @memberof ITextReader
         */
        Line:number;

        /**
         * 终结符
         *
         * @type {number}
         * @memberof ITextReader
         */
        EndChar:number;
        /**
         * 获取下一个字符
         *
         * @returns {number}
         * @memberof ITextReader
         */
        NextChar():number;

        /**
         * 推回一个字符
         *
         * @param {number} ch
         * @returns {ITextReader}
         * @memberof ITextReader
         */
        Pushback(ch:number):ITextReader;
    }

    export interface IRegularContext{
        Input:ITextReader;
        findRegular:(name:string)=>Regular;

    }

    /**
     * 字符串类型的文本阅读器
     *
     * @export
     * @class StringTextReader
     * @implements {ITextReader}
     */
    export class StringTextReader implements ITextReader{
        Input:string;
        At:number;
        Line:number;
        _pushedbackChar:number;
        EndChar:number;
        constructor(input:string,endChar?:number){
            this.Input = input;
            this.At =0;
            this.Line=0;
            this.EndChar = endChar ||0;
        }

        /**
         * 获取下一个字符
         *
         * @returns {number}
         * @memberof ITextReader
         */
        NextChar():number{
            if(this._pushedbackChar){
                let ch = this._pushedbackChar;
                this._pushedbackChar=undefined;
                return ch;
            }
            if(this.At>=this.Input.length) return this.EndChar;
            let ch= this.Input.charCodeAt(this.At++);
            if(ch===13) this.Line++;
            return ch;
        }

        Pushback(ch:number):ITextReader{
            
            if(this._pushedbackChar===undefined) throw new Error("已经有一个Pushback字符了，不允许再pushback.");
            if(ch===this.EndChar) throw new Error("不允许Pushback终结符");
            this._pushedbackChar=ch;
            return this;
        }

    }



    /**
     * 匹配结果
     *
     * @export
     * @interface IMatch
     */
    export interface IMatch{
        Input:ITextReader;
        At:number;
        Length:number;
        Line:number;
        Regular:Regular;
    }

    export enum MatchResults{
        /**
         * 不匹配
         */
        NotMatch,
        /**
         * 已匹配
         */
        Matched,    
        /**
         * 没有不匹配，但已经结束
         */
        End,

        /**
         * 匹配到了空字符
         */
        Empty
    }

    export interface IDescriptor{
        Min?:number;
        Max?:number;
        Repeat?:number;
        Navigate?:boolean;
        Token?:string;
    }
     /* 文法规则
     *
     * @export
     * @class Lexical
     */
    export class Regular{
        _min:number;
        _max?:number;
        _token?:string;
        constructor(_des?:Regular|IDescriptor|number){
            if(_des instanceof Regular){
                this._min = (_des as Regular)._min;
                this._max = (_des as Regular)._max;
                this._token = (_des as Regular)._token;
                return this;
            }
            if(typeof _des==="number"){
                this.Repeat(_des as number);
                return this;
            }
            let des = _des as IDescriptor;
            if(des){
                if(des.Min!==undefined){
                    if(des.Max){
                        this.Repeat(des.Min,des.Max);
                    }else this.MinRepeat(des.Min);
                }else{
                    if(des.Max!==undefined){
                        this.MaxRepeat(des.Max);
                    }else{
                        if(des.Repeat) this.Repeat(des.Repeat);
                    }
                }
            }else {
                this._min = this._max=1;
            }
            
        }
        Descriptor(value?:IDescriptor):Regular|IDescriptor{
            if(value===undefined) return {Min:this._min,Max:this._max,Token:this._token};
            this._min = value.Min;
            this._max = value.Max;
            this._token = value.Token;
            if(value.Repeat!==undefined){
                this._max= this._min = value.Repeat;
            }
            return this;
        }
        
        Repeat(minOrCount:number,max?:number):Regular{
            if(max===undefined){
                this._max = this._min = minOrCount;
                return this;
            }
            this._min = minOrCount;this._max = max;
            return this;
        }
        MinRepeat(min:number):Regular{
            this._min = min;
            this._max = undefined;
            return this;
        }
        MaxRepeat(max:number):Regular{
            this._max = max;
            this._min = 0;
            return this;
        }

        Replace(name:string,referred:Regular):Regular{
            return this;
        }

        /**
         * 重置规则的内部状态，让Match从头开始
         *
         * @returns {Regular}
         * @memberof Regular
         */
        Reset():Regular{return this;}

        Match(context:IRegularContext):IMatch{
            let reader = context.Input;
            
            let start = reader.At;
            let matchCount = 0;
            while(true){
                let ch = reader.NextChar();
                
                let matchResult = this.InternalMatch(ch,context);
                if(matchResult===MatchResults.End){
                    reader.Pushback(ch);
                    matchCount++;
                    if(matchCount>=this._min && this._max && matchCount==this._max){
                        return {
                            Input:reader,
                            At:start,
                            Length:reader.At-start,
                            Line:reader.Line,
                            Regular:this
                        };
                    }
                    this.Reset();
                }else if(matchResult===MatchResults.NotMatch){
                    return;
                } else if(matchResult===MatchResults.Empty){
                    //遇到空，必须跳出循环，否则每次都会匹配空字符串
                    //空字符串不算一次match所有没有matchCount++;
                    if(matchCount>=this._min && this._max && matchCount==this._max){
                        return {
                            Input:reader,
                            At:start,
                            Length:reader.At-start,
                            Line:reader.Line,
                            Regular:this
                        };
                    }
                    return;
                }
                //如果遇到结束符号，任何匹配都不成立
                if(ch === reader.EndChar) null;
            }
            
        }
        

        /**
         * 供子类override的函数
         *
         * @protected
         * @param {number} ch
         * @param {number} currentAt
         * @returns {boolean}
         * @memberof Regular
         */
        InternalMatch(ch:number,context:IRegularContext):MatchResults{
            throw new Error("Abstract method");
        }

        Clone(deep?:boolean):Regular{
            return new Regular(this);
        }

        toString(braced?:boolean){
            if(this._min==0){
                if(this._max===1)return "?";
                else if(this._max){
                    return `{,${this._max}}`;
                }else return "*";
            }else if(this._min===1){
                if(this._max===1) return "";
                else if(this._max) return `{1,${this._max}}`;
                else return "+";
            }else {
                if(this._min=== this._max) return `{${this._min}}`;
                return `{${this._min},${this._max}}`; 
            }
        }
    }

    export class EmptyRegular extends Regular{
        constructor(){
            super();
        }
        Match(context:IRegularContext):IMatch{
            return {
                Input:context.Input,
                At:context.Input.At,
                Line:context.Input.Line,
                Length:0,
                Regular:this
            };
        }
        InternalMatch(ch:number,context:IRegularContext):MatchResults{
            return MatchResults.Empty;
        }

        Clone():EmptyRegular{return this;}

        Replace(name:string,reg:Regular):Regular{return this;}

        toString():string{
            return "ε";
        }

        static value:EmptyRegular=new EmptyRegular();
    }
    export let emptyRegular :EmptyRegular = EmptyRegular.value;

    export class CharsetRegular extends Regular{
        Chars:string;
        _minCode:number;
        _maxCode:number;
        _nagative:boolean;
        constructor(chars:string|CharsetRegular,des?:boolean|number|IDescriptor){
            if(chars instanceof CharsetRegular){
                super(chars as CharsetRegular);
                this.Chars = (chars as CharsetRegular).Chars;
                this._maxCode=(chars as CharsetRegular)._maxCode;
                this._minCode = (chars as CharsetRegular)._minCode;
                this._nagative = (chars as CharsetRegular)._nagative;
                return;
            }
            if(typeof des==="boolean") {
                super();
                this._nagative = des;
                this._InitChars(chars);
            }else {
                super(des as IDescriptor);
                this._InitChars(chars);
            }
        }
        private _InitChars(chars:string){
            if(chars.length==3 && chars[1]==="-"){
                this._minCode = chars.charCodeAt(0);
                this._maxCode = chars.charCodeAt(2);
                this.Chars = chars;
                return this;
            }
            if(chars.length===4 && chars[1]=="\\"&& chars[2]==="-" ){
                this.Chars = chars[0]+ "-" + chars[3];
            }
        }
        Nagative(value?:boolean):CharsetRegular|boolean{
            if(value===undefined) return this._nagative;
            this._nagative=value;return this;
        }
        InternalMatch(ch:number,context:IRegularContext):MatchResults{
            for(let i =0,j=this.Chars.length;i<j;i++){
                let c = this.Chars.charCodeAt(i);
                
                if(c===ch) return this.Nagative?MatchResults.NotMatch:MatchResults.End;
            }
            return this.Nagative?MatchResults.End:MatchResults.NotMatch;
        }
        Clone():CharsetRegular{
            return new CharsetRegular(this);
        }

        Descriptor(value?:IDescriptor):IDescriptor|CharsetRegular{
            if(value===undefined)return {Min:this._min,Max:this._max,Token:this._token,Navigate :this._nagative};
            super.Descriptor(value);
            return this;
        }

        toString(braced?:boolean){
            let str= `[${this._nagative?'^':''}${this.Chars.replace(/\\+-\{\}\[\]\?\^\|\$/g,"\\$0")}]${super.toString()}`;
            return braced?`(${str})`:str;
        }
    }

    

    export class LiteralRegular extends Regular{
        Chars:string;
        constructor(chars:string|LiteralRegular,des:IDescriptor|number){
            if(chars instanceof LiteralRegular){
                super(chars as LiteralRegular);
                this.Chars = (chars as LiteralRegular).Chars;             
                return;
            }
            super(des);
            this.Chars =chars as string;
        }
        toString(braced?:boolean){
            return this.Chars;
        }
    }
    export class EndRegular extends CharsetRegular{
        
        constructor(chars:string|CharsetRegular,des?:boolean|number|IDescriptor){
            super(chars,des);
            
        }
        toString(){
            return "$";
        }
    }

    export class PlaceholderRegular extends Regular{
        Name:string;
        Token:string;
        InnerRegular:Regular;
        constructor(name:string,token?:string){
            super();
            this.Name = name;
            this.Token = token;
        }

        InternalMatch(ch:number,context:IRegularContext):MatchResults{
            let reg = context.findRegular(this.Name);
            return reg.InternalMatch(ch,context);
        }

        Replace(name:string,referred:Regular):Regular{
            //if(this.Name==name) return referred;
            return this;
        }
        Clone(deep?:boolean):PlaceholderRegular{return this;}

        
        toString(){
            if(this.Token){
                if(this.Name){
                    return `<#${this.Token}#>(<&${this.Name}&>)`;
                }else{
                    let str = this.InnerRegular.toString();

                }
            }
        }
    }
    

    export class ComposedRegular extends Regular{
        Regulars:Regular[];
        constructor(regsOrIns:ComposedRegular|number|IDescriptor|Regular[],des?:number|boolean|IDescriptor){
            if(regsOrIns instanceof ComposedRegular){
                super(regsOrIns);
                let regs = this.Regulars=[];
                for(let i in regsOrIns.Regulars){
                    regs.push(des?regsOrIns.Regulars[i].Clone():regsOrIns.Regulars[i]);
                }
                return this;
            } 
            if(regsOrIns && (regsOrIns as any).length && (regsOrIns as any).push){
                super(des as IDescriptor);
                this.Regulars=regsOrIns as Regular[];
                return this;
            }
            super(regsOrIns as ComposedRegular|number|IDescriptor);
            this.Regulars=[];
        }

        Replace(name:string,referred:Regular):Regular{
            throw new Error("Invalid Program.");
        }

        Reset():ComposedRegular{
            for(let i in this.Regulars){
                this.Regulars[i].Reset();
            }
            return this;
        }
        Clone(deep?:boolean){
            return new ComposedRegular(this);
        }
        Append(...args:Regular[]):ComposedRegular{
            for(let i =0,j=arguments.length;i<j;i++){
                this.Regulars.push(arguments[i]);
            }
            return this;
        }

        Charset(chars:string,des?:IDescriptor):ComposedRegular{
            let reg = new CharsetRegular(chars,des);
            this.Regulars.push(reg);
            return this;
        }

        Literal(chars:string,des?:IDescriptor):ComposedRegular{
            let reg = new LiteralRegular(chars,des);
            this.Regulars.push(reg);
            return this;
        } 
        Sequence(builder:(seq:SequenceRegular)=>void,des?:IDescriptor):ComposedRegular{
            let reg = new SequenceRegular(des);
            builder(reg);
            this.Regulars.push(reg);
            return this;
        }
        
        Optional(builder:(optional:OptionalRegular)=>void,des?:IDescriptor):ComposedRegular{
            let reg = new OptionalRegular(des);
            builder(reg);
            this.Regulars.push(reg);
            return this;
        }
                
    }
    export class SequenceRegular extends ComposedRegular{
        _ruleAt:number;
        _currentLRegular:Regular;
        _hasMatch:boolean;
        constructor(regs:IDescriptor|number|SequenceRegular|Regular[],des?:IDescriptor|number){ super(regs,des);this._ruleAt=0;}

        Reset():SequenceRegular{
            this._ruleAt=0;
            this._currentLRegular=this.Regulars[0];
            this._hasMatch=false;
            return super.Reset() as SequenceRegular;
        }

        /**
         * 排除空字符串
         *
         * @param {...Regular[]} args
         * @returns {ComposedRegular}
         * @memberof SequenceRegular
         */
        Append(...args:Regular[]):ComposedRegular{
            for(let i =0,j=arguments.length;i<j;i++){
                let reg = arguments[i];
                if(reg instanceof EmptyRegular) continue;
                this.Regulars.push(reg);
            }
            return this;
        }

        InternalMatch(ch:number,context:IRegularContext):MatchResults{
            if(this.Regulars.length==0) return MatchResults.Empty;
            if(this.Regulars.length==1) return this.Regulars[0].InternalMatch(ch,context);
            while(true){
                if(!this._currentLRegular) return this._hasMatch?MatchResults.End:MatchResults.Empty;
                let rs = this._currentLRegular.InternalMatch(ch,context);
                if(rs== MatchResults.Matched) return MatchResults.Matched;
                if(rs== MatchResults.NotMatch) return MatchResults.NotMatch;
                if(rs== MatchResults.End){
                    this._currentLRegular = this.Regulars[this._ruleAt++];
                    this._hasMatch=true;
                }else if(rs===MatchResults.Empty){
                    this._currentLRegular = this.Regulars[this._ruleAt++];
                }
            }
        }
        Clone():SequenceRegular{
            return new SequenceRegular(this);
        }
        
        toString(braced?:boolean){
            if(this.Regulars.length==0) return "";
            let str = "";
            for(let i in this.Regulars){
                let rule = this.Regulars[i];
                str+=rule.toString();
            }
            let times = super.toString();
            if(times) str= `(${str})${times}`;
            return braced?`{${str}}`:str;
        }
    
    }

   
    export class OptionalRegular extends ComposedRegular{
        
        _notCompletedLRegulars:Regular[];
        constructor(regs:IDescriptor|number|OptionalRegular|Regular[],des?:IDescriptor|number){ super(regs,des);}

        Reset():OptionalRegular{
            
            this._notCompletedLRegulars=null;
            return super.Reset() as OptionalRegular;
        }
        Clone():OptionalRegular{
            return new OptionalRegular(this);
        }

        Append(...args:Regular[]):ComposedRegular{
            let lastIsEmpty = this.Regulars.pop();
            if(!(lastIsEmpty instanceof EmptyRegular)){
                this.Regulars.push(lastIsEmpty);
                lastIsEmpty=undefined;
            }
            for(let i =0,j=arguments.length;i<j;i++){
                let reg = arguments[i];
                if(reg instanceof EmptyRegular){
                    if(!lastIsEmpty) lastIsEmpty=reg;
                    continue;
                } 
                this.Regulars.push(arguments[i]);
            }
            if(lastIsEmpty) this.Regulars.push(lastIsEmpty);
            return this;
        }

        InternalMatch(ch:number,context:IRegularContext):MatchResults{
            if(this.Regulars.length==0) return MatchResults.Empty;
            if(this.Regulars.length==1) return this.Regulars[0].InternalMatch(ch,context);
            if(!this._notCompletedLRegulars){
                this._notCompletedLRegulars=[];
                for(let i in this.Regulars) this._notCompletedLRegulars.push(this.Regulars[i]);
            }
            
            for(let i =0,j=this._notCompletedLRegulars.length;i<j;i++){
                let rule = this._notCompletedLRegulars.shift();
                let rs = rule.InternalMatch(ch,context);
                if(rs=== MatchResults.End) return rs;
                if(rs=== MatchResults.NotMatch) continue;
                this._notCompletedLRegulars.push(rule);
            }
            return this._notCompletedLRegulars.length==0?MatchResults.NotMatch:MatchResults.Matched;
        }

        toString(braced?:boolean){
            if(this.Regulars.length==0) return "";
            let str ="";
            for(let i in this.Regulars){
                let rule = this.Regulars[i];
                if(str) str += "|";
                str+=rule.toString();
            }
            let rep = super.toString();
            if(rep) str = `(${str})${rep}`;
            return braced?`(${str})`:str;
        }
    }
    export interface ILexicalContext{
        Input:ITextReader;

    }
    
    

    export class Lexical {
        Name:string;
        Regular:OptionalRegular;
        _Current:SequenceRegular;
        _Grammer:Grammer;
        constructor(grammer:Grammer,name:string,reg?:OptionalRegular){
            this.Name=name;
            this._Grammer = grammer;
            (this.Regular = reg|| new OptionalRegular(1)).Append(EmptyRegular.value);
            //if(this.Regular.Regulars)

        }
        Charset(chars:string,des?:IDescriptor|number|boolean):Lexical{
            let reg :Regular = new CharsetRegular(chars,des);
            

            this._Current.Append(reg);
            return this;
        }
        Literal(chars:string,des?:IDescriptor|number):Lexical{
            let reg =new LiteralRegular(chars,des);
            
            this._Current.Append(reg);
            return this;
        }
        Reference(name:string,token?:string):Lexical{
            let reg = new PlaceholderRegular(name,token);
            this._Current.Append(reg);
            return this;
        }
        Optional():Lexical{
            
            this._Current = new SequenceRegular(1);
            (this.Regular as OptionalRegular).Append(this._Current);
            return this;
        }

        Replace(referred:Lexical):Lexical{
            let me_optionals:SequenceRegular[] = this.Regular.Regulars as SequenceRegular[];
            let ref_optionals = referred.Regular.Regulars;

            //(eAb|d|cA)REP(1|2) = e(1|2)b|d|c(1|2)=e1b|e2b|d|c1|c2
            //(eAb|d|c?A)+REP(1|2)+ = e(1|2)+b|d|c?(1|2)+=e1b|e2b|d|c1|c2
            // (G|H+)*REP H->(I|J)+ = (G|((I|J)+)+)

            for(let i =0,j=me_optionals.length;i<j;i++){
                let me_branch:SequenceRegular = me_optionals.shift();
                let me_branch_items:Regular[] = me_branch.Regulars;
                for(let m =0,n = ref_optionals.length;m<n;m++){
                    let ref_branch:SequenceRegular = ref_optionals[m] as SequenceRegular;
                    let ref_branch_items:Regular[] = ref_branch.Regulars;
                    let new_branch_items:Regular[]=[];
                    for(let n=0,m=me_branch_items.length;n<m;n++){
                        let me_item = me_branch_items[i];
                        if(!(me_item instanceof PlaceholderRegular) || me_item.Name!==referred.Name){
                            new_branch_items.push(me_item);continue;
                        }
                         // (G|H+)*REP H->(I|J)+ = (G|((I|J)+)+)
                        let me_des = me_item.Descriptor() as IDescriptor;
                        for(let s in ref_branch_items){
                            let ref_item = ref_branch_items[s];
                            let ref_des = ref_item.Descriptor() as IDescriptor;
                            me_des.Min *= ref_des.Min;
                            me_des.Max *= ref_des.Max;
                            let item = ref_item.Clone().Descriptor(me_des) as Regular;
                            new_branch_items.push(item);
                        }
                    }

                    me_optionals.push(new SequenceRegular(new_branch_items,));
                }
            }
            return this;
        }

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
        Eliminate():Lexical{
            let branchs = [];
            if(!(this.Regular instanceof OptionalRegular)) {
                branchs = [this.Regular, EmptyRegular.value];
            }else branchs = this.Regular.Regulars;
            //A→Aa1｜Aa2……｜Aan｜b1｜b2……｜bm。其中每个a都不等于ε，而每个b都不以A开头
            let extRegular :OptionalRegular = new OptionalRegular(1);
            for(let i =0,j=branchs.length;i<j;i++){
                let branch = branchs.shift();
                if(branch.Regulars[0]===this.Regular){
                    if(branch.Regulars.length==1) throw new Error("循环定义的文法");
                    //Aa1 => a1A'
                    let extReg = branch.Clone();
                    extReg.Regulars.shift();
                    extReg.Regulars.push(extReg);
                    extRegular.Regulars.push(extReg);
                } 
                else {
                    branchs.push(branch);
                }
            }
            //没有直接左递归，什么都不做
            if(!extRegular.Regulars.length) return this;
            //branchs中剩下的都是不以A开头的
            for(let i in branchs){
                // A→b1A’｜b2A’……｜bmA’
                branchs[i].Append(extRegular);
            }
            this._Grammer.Define(this.Name + "'",extRegular);
        }

    }

    /**
     * 文法
     *
     * @export
     * @class Grammer
     */
    export class Grammer{
        _Names:{[name:string]:Lexical};
        _Lexicals:Lexical[];
        Define(name:string,reg?:Regular):Lexical{
            let existed = this._Names[name];
            if(!existed){
                existed = this._Names[name] = new Lexical(this,name,reg as OptionalRegular);
                this._Lexicals.push(existed);
            }
            return existed;
        }
        Eliminate(){
            //消除左递归
            for(let i =0,m=this._Lexicals.length;i<m;i++){
                for(let j=0;j<i;j++){
                    let lexical_i = this._Lexicals[i];
                    let lexical_j = this._Lexicals[j];
                    lexical_i.Replace(lexical_j);
                    lexical_i.Eliminate();
                }
                

            }
        }
    }
    

    
//Lexical 文法生成token
//syntax 生成语法
//semantic 语义 类型检查
//Grammar 语法
}}