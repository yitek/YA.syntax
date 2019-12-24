export interface ITestLogger {
    beginGroup(title: string): any;
    endGroup(): any;
    info(msg: string): any;
    assert(condition: boolean, msg: string): any;
    error(msg: string, err?: Error): any;
    warn(msg: string): any;
}
export declare class UnittestError extends Error {
    outerMessage: string;
    constructor(msg: string, outerMessage?: string);
    toString(): string;
}
export declare class Unittest {
    _$members: {
        [name: string]: any;
    };
    _$errors: {
        Message: string;
        Exception?: Error;
        Name?: string;
    }[];
    $NAME: string;
    _$logger: ITestLogger;
    constructor(name?: string, logger?: ITestLogger);
    $RUN(target?: any): {
        Message: string;
        Exception?: Error;
        Name?: string;
    }[];
    static Test(name: string | object | Function, target?: object | Function): Unittest;
    static hiddenSteps: boolean;
}
