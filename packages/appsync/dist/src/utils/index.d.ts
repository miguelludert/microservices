export declare const findStack: (cfSchema: any, stackName: any) => any;
export declare const filterResourcePairsByType: (resourcePairs: any, type: any) => any;
export declare const gatherStacks: (cfSchema: any) => any;
export declare const addSuffix: (suffix: any, str: any) => any;
export declare function flatten(arr: any, d?: number): any;
export declare function tryCallback<TResult>(callback: () => TResult, errorMessage: string | Error): TResult;
export declare function dedupeTail(name: string): string;
export * from './getDatasourceCfn';
export * from './resource-utils';
