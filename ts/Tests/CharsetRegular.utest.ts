import {CharsetRegular,LiteralRegular,SequenceRegular,RegularContext, OptionalRegular} from '../YA.syntax'


export interface ITestLogger{
    beginGroup(title:string);
    endGroup();
    info(msg:string);
    assert(condition:boolean,msg:string);
    error(msg:string,err?:Error);
    warn(msg:string);
}

export class UnittestError extends Error{
    outerMessage:string;
    constructor(msg:string,outerMessage?:string){
        super(msg);
        this.outerMessage=outerMessage;
    }
    toString(){
        if(this.outerMessage) return this.outerMessage;
        return super.toString();
    }
}

export class Unittest{
    _$members:{[name:string]:any};
    _$errors:{
        Message:string,
        Exception?:Error,
        Name?:string
    }[];
    $NAME:string;
    _$logger:ITestLogger;
    constructor(name?:string,logger?:ITestLogger){
        this.$NAME = name;
        this._$members={};
        this._$errors=[];
        if(!logger) logger={
            info:(msg)=>console.info(msg)
            ,error:(msg,err)=>console.error(msg,err)
            ,assert:(cond,msg)=>console.assert(cond,msg)
            ,warn:(msg)=>console.warn(msg)
            ,beginGroup:(title)=>console.group(title)
            ,endGroup:()=>console.groupEnd()
        };
        this._$logger=logger;
        
    }

    $RUN(target?:any):{
        Message:string,
        Exception?:Error,
        Name?:string
    }[]{
        if(!target) target = this;
        if(typeof target==="function") target = new target();
        let count = 0;
        this._$logger.beginGroup(`{${this.$NAME}}`);
        let assert =(actual?:any,expected?:any,msg?:string,paths?:string[])=>{
            if(!paths && msg) msg = msg.replace(/\{actual\}/g,JSON.stringify(actual)).replace(/\{expected\}/g,JSON.stringify(expected));
            if(actual===expected) {
                if(!Unittest.hiddenSteps && msg && !paths){
                    this._$logger.info(msg);
                }
                return;
            }
            let t = typeof(expected);
            
            if(t==="object"){
                paths||(paths=[]);
                //let nullMsg = msg || "期望有值";
                if(!actual) throw new UnittestError(paths.join(".")+"不应为空.",msg);

                for(let n in expected){
                    paths.push(n);
                    let expectedValue = expected[n];
                    let actualValue = actual[n];
                    if(typeof expectedValue==="object"){
                        assert(actualValue,expectedValue,msg,paths);
                    }else {
                        if(actualValue!==expectedValue){
                            throw new UnittestError(`${paths.join(".")}期望值为${expectedValue},实际为${actualValue}`,msg);
                        }
                    }
                    paths.pop();
                }
                if(!Unittest.hiddenSteps && msg && !paths.length){
                    this._$logger.info(msg);
                }
            }else if(actual!==expected){
                throw new UnittestError(`${paths.join(".")}期望值为${actual},实际为${expected}`,msg);
            }else {
                if(!Unittest.hiddenSteps && msg && !paths){
                    this._$logger.info(msg);
                }
            }
        }
        let info = (msg:string,expected?:any)=>{
            msg = msg.replace(/\{variable\}/g,JSON.stringify(expected));
            this._$logger.info(msg);
        }
        for(let name in target){
            if(name==="$RUN" || name==="$NAME") continue;
            let fn = (target as any)[name];
            if(typeof fn !=="function") continue; 
            this._$logger.beginGroup(`(${name})`);
                        
            let ex=undefined;
            try{
                count++;
                fn.call(target,assert,info);
                this._$members[name]=true;
                
            }catch(ex){
                this._$members[name]=false;
                let msg = ex.outerMessage || ex.toString();
                this._$errors.push({
                    Message:msg,
                    Exception:ex,
                    Name:name
                });
                this._$logger.error(msg,ex);
            }
            this._$logger.endGroup();
            
        }
        this._$errors.length?this._$logger.warn(`结束测试{${this.$NAME}},错误率:${this._$errors.length}/${count}=${this._$errors.length*100/count}%.`):this._$logger.info(`结束测试{${this.$NAME}},错误率:${this._$errors.length}/${count}=0%..`);
        this._$logger.endGroup();
        return this._$errors;
    }
    static Test(name:string|object|Function,target?:object|Function):Unittest{
        if(target===undefined){
            target = name as Object;
            name=undefined;
        }
        let utest = new Unittest(name as string);
        utest.$RUN(target);
        return utest;

    }

    static hiddenSteps:boolean;
   
}


Unittest.Test("CharsetRegular",{
    "Charset":(assert:(actual:any,expected:any,message?:string)=>any,info:(msg:string,variable?:any)=>any)=>{
        let reg = new CharsetRegular("A");
        let expected ={at:0,length:1};
        
        let ctx = new RegularContext("Abc");
        
        let rs = reg.Match(ctx);
        assert(rs,expected,`测试单一字符匹配:/${reg}/.match("${ctx}")=={expected}`);
        
        ctx = new RegularContext("abc");
        rs = reg.Match(ctx);
        assert(rs,null,`测试单一字符不匹配:/${reg}/.match("${ctx}")===={expected}`);
        
        //-----------------------------
        reg = new CharsetRegular("ACF");
        ctx = new RegularContext("aDE");
        
        rs = reg.Match(ctx);
        assert(rs,null,`测试字符集不匹配:/${reg}/.match("${ctx}")=={expected}`);

        ctx = new RegularContext("BCF");
        rs = reg.Match(ctx);
        assert(rs,null,`测试字符集不匹配:/${reg}/.match("${ctx}")=={expected}`);

        ctx = new RegularContext("Abc");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试字符集匹配:/${reg}/.match("${ctx}")=={expected}`);
        

        ctx = new RegularContext("Cbc");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试字符集匹配:/${reg}/.match("${ctx}")=={expected}`); 

        ctx = new RegularContext("Fbc");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试字符集匹配:/${reg}/.match("${ctx}")=={expected}`);
        

        reg = new CharsetRegular("A-F");
        ctx = new RegularContext("abc");
        //info(`/${reg}/.match("${ctx}")==={expected}`);
        rs = reg.Match(ctx);
        assert(rs,null,`测试字符范围不匹配:/${reg}/.match("${ctx}")=={expected}`);

        ctx = new RegularContext("Abc");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试字符范围匹配:/${reg}/.match("${ctx}")=={expected}`);
        
        ctx = new RegularContext("Dbc");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试字符范围匹配:/${reg}/.match("${ctx}")=={expected}`);
    }
    ,"Nagative":(assert,info)=>{
        let reg = new CharsetRegular("A",true);
        let ctx = new RegularContext("Abc");
        let expected ={at:0,length:1};

        let rs = reg.Match(ctx);
        assert(rs,null,`测试单一字符非集不匹配:/${reg}/.match("${ctx}")=={expected}`);

        
        ctx = new RegularContext("abc");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试单一字符非集匹配:/${reg}/.match("${ctx}")=={expected}`);

        ctx = new RegularContext("Fbc");
        rs = reg.Match(ctx);
        assert(rs,null,`测试字符集合非集不匹配:/${reg}/.match("${ctx}")=={expected}`);

        
        reg = new CharsetRegular("AF",true);
        ctx = new RegularContext("Abc");
        rs = reg.Match(ctx);
        assert(rs,null,`测试字符集合非集匹配:/${reg}/.match("${ctx}")=={expected}`);

        ctx = new RegularContext("abc");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试字符集合非集匹配:/${reg}/.match("${ctx}")=={expected}`);        

        reg = new CharsetRegular("A-F",true);
        ctx = new RegularContext("Dbc");
        rs = reg.Match(ctx);
        assert(rs,null,`测试范围集合非集不匹配:/${reg}/.match("${ctx}")=={expected}`);

        ctx = new RegularContext("abc");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试范围集合非集匹配:/${reg}/.match("${ctx}")=={expected}`);
    }
    ,"Repeat":(assert)=>{
        
        let expected ={at:0,length:3};
        let reg = new CharsetRegular("A-C",3);
        let ctx = new RegularContext("BCAbc");
        let rs = reg.Match(ctx);
        assert(rs,expected,`测试大于max的:/${reg}/.match("${ctx}")=={expected}`);

        reg = new CharsetRegular("A",3);
        ctx = new RegularContext("Abc");
        rs = reg.Match(ctx);
        assert(rs,null,`测试小于min的:/${reg}/.match("${ctx}")=={expected}`);

        reg = new CharsetRegular("ADE",{minTimes:1,maxTimes:3,navigate:true});
        ctx = new RegularContext("rrAEs");
        expected.length=2;
        rs = reg.Match(ctx);
        assert(rs,expected,`测试min,max中间的:/${reg}/.match("${ctx}")=={expected}`);

        reg = new CharsetRegular("A",{minTimes:1});
        ctx = new RegularContext("AAA");
        expected.length=3;
        rs = reg.Match(ctx);
        assert(rs,expected,`测试*到EOF:/${reg}/.match("${ctx}")=={expected}`);
    }
    ,"Literal":(assert)=>{
        let expected ={at:0,length:5};
        let reg = new LiteralRegular("Hello");
        let ctx = new RegularContext("Hallo,Yi.");
        let rs = reg.Match(ctx);
        assert(rs,null,`测试字符串不匹配:/${reg}/.match("${ctx}")=={expected}`);

        ctx = new RegularContext("Hello,Yi.");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试字符串匹配:/${reg}/.match("${ctx}")=={expected}`);
        reg = new LiteralRegular("Hello",{minTimes:1,maxTimes:3});
        ctx = new RegularContext("HelloHelloHelloHello.");
        expected ={at:0,length:15};
        rs = reg.Match(ctx);
        assert(rs,expected,`测试字符串匹配:/${reg}/.match("${ctx}")=={expected}`);
    }

    ,"Sequence":(assert)=>{
        let expected ={at:0,length:3};
        let reg = new SequenceRegular();
        reg.Charset("1-9",{minTimes:0}).Literal(",").Charset("abc",{minTimes:1});
        let ctx = new RegularContext("1,d");
        let rs = reg.Match(ctx);
        assert(rs,null,`测试序列不匹配:/${reg}/.match("${ctx}")=={expected}`);

        ctx = new RegularContext(",bb");
        rs = reg.Match(ctx);
        assert(rs,expected,`测试序列匹配:/${reg}/.match("${ctx}")=={expected}`);
        
        reg = new SequenceRegular({minTimes:2});
        reg.Charset("1-9",{minTimes:0}).Literal(",q").Charset("abc",{minTimes:1});
        ctx = new RegularContext(",qbb21,qc,qca4,qbq");
        rs = reg.Match(ctx);
        assert(rs,{at:0,length:17},`测试序列匹配:/${reg}/.match("${ctx}")=={expected}`);
        
    }
    ,"optional":(assert)=>{
        let reg = new OptionalRegular();
        reg.Charset("1-9",{minTimes:0}).Literal(",").Charset("abc",{minTimes:1});
        let ctx = new RegularContext("1,d");   
    }
});