

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
    fetech():number;

    /**
     * 推回一个字符
     *
     * @param {number} ch
     * @returns {ITextReader}
     * @memberof ITextReader
     */
    pushback(ch:number):ITextReader;

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
    fetech():number{
        
        if(this._pushedbackChar){
            let ch = this._pushedbackChar;
            this._pushedbackChar=undefined;
            this.at++
            return ch;
        }
        if(this.at>=this.raw.length) { this.EOF = true;return this.end;}
        let ch= this.raw.charCodeAt(this.at++);
        if(ch===13) this.line++;
        return ch;
    }

    pushback(ch:number):ITextReader{
        
        if(this._pushedbackChar!==undefined) throw new Error("已经有一个Pushback字符了，不允许再pushback.");
        if(this.EOF) return this;
        //if(ch===this.EndChar) throw new Error("不允许Pushback终结符");
        this._pushedbackChar=ch;
        this.at--;
        return this;
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
                return {
                    input:input,
                    at:at,
                    length:input.at-at,
                    line:input.line,
                    regular :this
                }
            }else if(rs ===RegularMatchResults.NotMatch){
                return null;
            }
            // Uncertain,继续找
            if(input.EOF) return;
        }
    }

    CheckMatch(input:ITextReader):RegularMatchResults{
        let ch = input.fetech();
        let rs = this.InternalCheck(ch);
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
            //把当前字符退回到input去，下一个匹配要用这个字符开始
            input.pushback(ch);
            //获取出当前状态
            let times = this._repeatedTimes;
            
            if(this._isRepeatCheck) {
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
            this._isRepeatCheck=false;
            return RegularMatchResults.Unkcertain;
        } 
    }

    protected InternalCheck(ch:number):RegularMatchResults{
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
            return `{${this._minTimes},${this._maxTimes}}`; 
        }
    }
}

export class CharsetRegular extends Regular{
    _navigate:boolean;
    Chars:string;
    _code:number;
    _minCode:number;
    _maxCode :number;
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

    _CheckChar(ch:number):RegularMatchResults{
        if (ch===this._code)
            return this._navigate? RegularMatchResults.NotMatch:RegularMatchResults.Matched;
        else return this._navigate? RegularMatchResults.Matched:RegularMatchResults.NotMatch;
    }
    _CheckRange(ch:number):RegularMatchResults{
        if(ch>=this._minCode && ch<=this._maxCode)
            return this._navigate? RegularMatchResults.NotMatch:RegularMatchResults.Matched;
        else return this._navigate? RegularMatchResults.Matched:RegularMatchResults.NotMatch;
    }
    _Check(ch:number):RegularMatchResults{
        for(let i =0,j=this.Chars.length;i<j;i++){
            if(this.Chars.charCodeAt(i)===ch){
                return (this._navigate)?RegularMatchResults.NotMatch:RegularMatchResults.Matched;
            }
        }
        return (this._navigate)?RegularMatchResults.Matched:RegularMatchResults.NotMatch;
    }

    toString(){
        if(this.InternalCheck===this._CheckChar) return `${this._navigate?"^":""}${this.Chars}${super.toString()}`;
        if(this.InternalCheck==this._CheckRange) return `[${this._navigate?"^":""}${this.Chars}]${super.toString()}`;
        return `[${this._navigate?"^":""}${this.Chars.replace(/[\/\-\[\]\{\}\*\+\?\^\\\(\)]/g,"\\$1")}]${super.toString()}`;
    }

}
   
//Lexical 文法生成token
//syntax 生成语法
//semantic 语义 类型检查
//Grammar 语法
