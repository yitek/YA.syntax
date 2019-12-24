export enum RegularMatchResults{
    
    /**
     * 不确定,中间态
     */
    Unkcertain,

    /**
     *已经匹配,最终态
        */
    Matched,

    /** 
     * 不匹配 ，终态
     */
    NotMatch,

    /**
     * 空匹配,终态
     */
    Empty
}

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
    at:number;

    /**
     * 当前行
     *
     * @type {number}
     * @memberof ITextReader
     */
    line:number;

    /**
     * 终结符
     *
     * @type {number}
     * @memberof ITextReader
     */
    end:number;
    /**
     * 获取下一个字符
     *
     * @returns {number}
     * @memberof ITextReader
     */
    fetech(handler:(ch:number)=>RegularMatchResults):RegularMatchResults;


    EOF:boolean;
}


/**
 * 字符串类型的文本阅读器
 *
 * @export
 * @class StringTextReader
 * @implements {ITextReader}
 */
export class StringTextReader implements ITextReader{
    raw:string;
    at:number;
    line:number;
    _pushedbackChar:number;
    end:number;
    EOF:boolean;
    constructor(input:string,endChar?:number){
        this.raw = input;
        this.at =0;
        this.line=0;
        this.end = endChar ||0;
    }

    /**
     * 获取下一个字符
     *
     * @returns {number}
     * @memberof ITextReader
     */
    fetech(handler:(ch:number)=>RegularMatchResults):RegularMatchResults{
        let ch :number;
        if(this.EOF){return RegularMatchResults.NotMatch;}
        else {
            ch= this.raw.charCodeAt(this.at++);
            if(ch===13) this.line++;
            if(this.at===this.raw.length) this.EOF=true;
        }
        let rs = handler(ch);
        //if(this.EOF){this.at=this.raw.length; return rs;}
        if(rs===RegularMatchResults.Empty|| rs=== RegularMatchResults.NotMatch){
            this.at--;
            this.EOF=false;
        }
            
        
        return rs;
    }

    

    toString(){
        return this.raw;
    }
}

export interface IRegularDescriptor{
    minTimes?:number;
    maxTimes?:number;
    times?:number;
    navigate?:boolean;
    token?:string;
}



export interface IRegularMatch{
    at:number;
    line:number;
    length:number;
    input:ITextReader;
    regular:Regular;
}
export interface IRegularContext{
    input:ITextReader;
    onMatched?:(match:IRegularMatch)=>void;
}

export class RegularContext{
    input:ITextReader;
    onMatched?:(match:IRegularMatch)=>void;
    constructor(raw:string|ITextReader){
        if(typeof raw ==="string") this.input = new StringTextReader(raw);
        else this.input = raw as ITextReader;
    }
    toString(){return this.input.toString();}
}

export class Regular{
    _minTimes:number;
    _maxTimes?:number;
    _repeatedTimes:number;
    _isRepeatCheck:boolean;
    Token:string;
    constructor(des:IRegularDescriptor|number|string){
        this._repeatedTimes=0;
        let t = typeof des;
        if(t==="number"){this._maxTimes=this._minTimes = des as number;}
        else if(t==='object'){
            if((des as IRegularDescriptor).times){
                this._maxTimes = this._minTimes = (des as IRegularDescriptor).times;
            }else {
                this._maxTimes = (des as IRegularDescriptor).maxTimes;
                this._minTimes = (des as IRegularDescriptor).minTimes;
            }
        }else {
            if(t==="string") this.Token=des as string;
            this._maxTimes = this._minTimes = 1;
        }
    }
    Reset():Regular{
        this._repeatedTimes=0;
        this._isRepeatCheck=false;
        return this;
    }

    Match(ctx:IRegularContext):IRegularMatch{
        let input = ctx.input;
        let at =input.at;
        while(true){
            let rs = this.CheckMatch(input);
            if(rs===RegularMatchResults.Empty || rs===RegularMatchResults.Matched){
                this.Reset();
                return {
                    input:input,
                    at:at,
                    length:input.at-at,
                    line:input.line,
                    regular :this
                }
            }else if(rs ===RegularMatchResults.NotMatch){
                this.Reset();
                return null;
            }
            // Uncertain,继续找
            
        }
    }

    CheckMatch(input:ITextReader):RegularMatchResults{
        //let ch = input.fetech();
        let rs = this.InternalCheck(input);
        if(rs===RegularMatchResults.Matched){
            let times = ++this._repeatedTimes;
            this.Reset();
            //如果达到了最大次数
            if(times=== this._maxTimes){ 
                //重置正则状态，下次匹配从初始状态开始
                return RegularMatchResults.Matched;
            }
            this._repeatedTimes = times;
            //this._repeatedTimes= times;
            return RegularMatchResults.Unkcertain;
        }
        else if(rs === RegularMatchResults.NotMatch || rs === RegularMatchResults.Empty){
            
            //获取出当前状态
            let times = this._repeatedTimes;
            
            if(this._isRepeatCheck) {
                this.Reset();
                if(times) return RegularMatchResults.Matched;
                return RegularMatchResults.NotMatch;
            }
            
            //重来都没有匹配上
            if(times===0) {this.Reset();return this._minTimes===0?RegularMatchResults.Empty:RegularMatchResults.NotMatch;}
            //检查最小匹配次数
            if(times<this._minTimes) {this.Reset();return RegularMatchResults.NotMatch;}
            this.Reset();
            this._repeatedTimes = times;
            this._isRepeatCheck=true;
            return RegularMatchResults.Unkcertain;
            
        }else{
            //this._isRepeatCheck=false;
            return RegularMatchResults.Unkcertain;
        } 
    }

    InternalCheck(input:ITextReader):RegularMatchResults{
        throw new Error("Abstract method");
    }

    toString(braced?:boolean){
        if(this._minTimes==0){
            if(this._maxTimes===1)return "?";
            else if(this._maxTimes){
                return `{,${this._maxTimes}}`;
            }else return "*";
        }else if(this._minTimes===1){
            if(this._maxTimes===1) return "";
            else if(this._maxTimes) return `{1,${this._maxTimes}}`;
            else return "+";
        }else {
            if(this._minTimes=== this._maxTimes) return `{${this._minTimes}}`;
            return `{${this._minTimes},${this._maxTimes||""}}`; 
        }
    }
}

export class CharsetRegular extends Regular{
    private _navigate:boolean;
    Chars:string;
    private _code:number;
    private _minCode:number;
    private _maxCode :number;
    constructor(chars:string,des?:IRegularDescriptor|boolean|number|string){
        super(des as IRegularDescriptor);
        if(typeof des==='boolean') this._navigate= des as boolean;
        else if(typeof des==='object') this._navigate = (des as IRegularDescriptor).navigate || false;
        this.Chars = chars;
        
        if(chars.length===0) throw new Error("必须要指定字符集");
        else if(chars.length===1){this._code = chars.charCodeAt(0);this.InternalCheck = this._CheckChar;}
        else if(chars.length===3 && chars[1]==="-"){this._minCode=chars.charCodeAt(0);this._maxCode = chars.charCodeAt(2);this.InternalCheck= this._CheckRange;}
        else {
            if(chars.length===4 && chars[1]=="\\" && chars[2]==="-") this.Chars = chars[0] + "-" + chars[3];
            this.InternalCheck = this._Check;
        }
        
    }

    _CheckChar(input:ITextReader):RegularMatchResults{
        return input.fetech((ch)=>{
            if (ch===this._code)
            return this._navigate? RegularMatchResults.NotMatch:RegularMatchResults.Matched;
            else return this._navigate? RegularMatchResults.Matched:RegularMatchResults.NotMatch;
        });
        
    }
    _CheckRange(input:ITextReader):RegularMatchResults{
        return input.fetech((ch)=>{
            if(ch>=this._minCode && ch<=this._maxCode)
                return this._navigate? RegularMatchResults.NotMatch:RegularMatchResults.Matched;
            else return this._navigate? RegularMatchResults.Matched:RegularMatchResults.NotMatch;
        });
        
    }
    _Check(input:ITextReader):RegularMatchResults{
        return input.fetech((ch)=>{
            for(let i =0,j=this.Chars.length;i<j;i++){
                if(this.Chars.charCodeAt(i)===ch){
                    return (this._navigate)?RegularMatchResults.NotMatch:RegularMatchResults.Matched;
                }
            }
            return (this._navigate)?RegularMatchResults.Matched:RegularMatchResults.NotMatch;
        });
        
    }

    toString(){
        if(this.InternalCheck===this._CheckChar) return `${this._navigate?"^":""}${this.Chars}${super.toString()}`;
        if(this.InternalCheck==this._CheckRange) return `[${this._navigate?"^":""}${this.Chars}]${super.toString()}`;
        return `[${this._navigate?"^":""}${this.Chars.replace(/[\/\-\[\]\{\}\*\+\?\^\\\(\)]/g,"\\$1")}]${super.toString()}`;
    }

}

export class LiteralRegular extends Regular{
    Chars:string;
    private _matchAt:number;
    constructor(chars:string,des?:IRegularDescriptor|number){
        if(chars.length==0) throw new Error("不可以输入空字符");
        super(des);
        this.Chars = chars;
        this._matchAt=0;
    }
    Reset():LiteralRegular{
        super.Reset();
        this._matchAt=0;
        return this;
    }
    InternalCheck(input:ITextReader):RegularMatchResults{
        return input.fetech((ch)=>{
            let code = this.Chars.charCodeAt(this._matchAt++);
            if(ch===code) return this.Chars.length==this._matchAt?RegularMatchResults.Matched:RegularMatchResults.Unkcertain;
            return RegularMatchResults.NotMatch;
        });
        
    }
    toString(braced?:boolean):string{
        let des = super.toString();
        return des?`(${this.Chars})${des}`:this.Chars;
    }
}

export class PolyRegular extends Regular{
    Regulars:Regular[];
    constructor(des?:IRegularDescriptor|number){
        super(des);
        this.Regulars=[];
    }
    Charset(chars:string,des?:IRegularDescriptor|number):PolyRegular{
        this.Regulars.push(new CharsetRegular(chars,des));
        return this;
    }

    Literal(chars:string,des?:IRegularDescriptor|number):PolyRegular{
        this.Regulars.push(new LiteralRegular(chars,des));
        return this;
    }
}
export class SequenceRegular extends PolyRegular{
    private _stepAt:number;
    constructor(des?:IRegularDescriptor|number){
        super(des);
        this._stepAt=0;
    }
    Reset():SequenceRegular{
        this._stepAt=0;
        for(let i in this.Regulars) this.Regulars[i].Reset();
        return super.Reset() as SequenceRegular;
    }
    
    InternalCheck(input:ITextReader):RegularMatchResults{
        let regular = this.Regulars[this._stepAt];
        let rs = regular.CheckMatch(input);
        if(rs===RegularMatchResults.Matched || rs===RegularMatchResults.Empty){
            if(this._stepAt == this.Regulars.length-1) return RegularMatchResults.Matched;
            this._stepAt++;return RegularMatchResults.Unkcertain;
        }else return rs;
    }
    optional(builder:(optional:OptionalRegular)=>void,des?:IRegularDescriptor|number):SequenceRegular{
        let optional = new OptionalRegular(des);
        this.Regulars.push(optional);
        builder(optional);
        return this;
    }
    toString(braced?:boolean):string{
        let str = "";
        for(let i in this.Regulars){
            let s= this.Regulars[i];
            if(s instanceof OptionalRegular) str += `(${s.toString()})`;
            else str += s.toString();
        }
        let des = super.toString();
        if(des) return `(${str})${des}`;
        return str;
    }
}

export class OptionalRegular extends PolyRegular{
    private _liveRegulars:Regular[];
    private _emptyRegular:Regular;
    constructor(des?:IRegularDescriptor|number){
        super(des);
        
    }
    Reset():SequenceRegular{
        this._liveRegulars=undefined;
        this._emptyRegular=undefined;
        for(let i in this.Regulars) {
            this.Regulars[i].Reset();
        }
        return super.Reset() as SequenceRegular;
    }

    sequence(builder:(seq:SequenceRegular)=>void,des?:IRegularDescriptor|number):OptionalRegular{
        let seq = new SequenceRegular(des);
        this.Regulars.push(seq);
        builder(seq);
        return this;
    }
    
    InternalCheck(input:ITextReader):RegularMatchResults{
        let livedRegulars = this._liveRegulars ;
        if(!livedRegulars){
            livedRegulars = this._liveRegulars=[];
            for(let i in this.Regulars) livedRegulars.push(this.Regulars[i]);
        }
        for(let i =0,j=livedRegulars.length;i<j;i++){
            let regular = livedRegulars.shift();
            let rs = regular.CheckMatch(input);
            if(rs===RegularMatchResults.Unkcertain){
                livedRegulars.push(regular);
            } else if(rs===RegularMatchResults.Empty){
                if(!this._emptyRegular) this._emptyRegular= regular;
            }else if(rs===RegularMatchResults.Matched){
                return rs;
            }
        }
        if(livedRegulars.length===0){
            return this._emptyRegular? RegularMatchResults.Empty:RegularMatchResults.NotMatch;
        }
        return RegularMatchResults.Unkcertain;
        
    }
    toString(braced?:boolean):string{
        let str = "";
        for(let i in this.Regulars){
            let s= this.Regulars[i];
            if(s instanceof SequenceRegular) str += `(${s.toString()})`;
            else str += s.toString();
        }
        let des = super.toString();
        if(des) return `(${str})${des}`;
        return str;
    }
}
  
   
//Lexical 文法生成token
//syntax 生成语法
//semantic 语义 类型检查
//Grammar 语法
