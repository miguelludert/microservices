* Add a function to read an entire directory from a single path.  This should read the directories in the path and by convention pick up all of the \
```
// directory structure
folder
    func1
    func2
    func3
    utils
    shared

// invocation

type FunctionDir = (string : dir, except? : string[]) => Record<string,string>;
const functionsDir : FunctionDir = /* implementation */;
const functions = functionsDir('path/to/function/folder',['shared','utils']);


// outputs 
{
    func1 : '/root/path/to/function/folder/func1/index.ts',
    func2 : '/root/path/to/function/folder/func2/index.ts',
    func3 : '/root/path/to/function/folder/func3/index.ts'
}

// becomes
new AppsyncSchemaTransformer(this, `appsync`, {
    ...props
    functionProps : {
        ...functions,
        func4 : join(__dirname, 'path/to/function/folder/func1/index.ts'),
        func5 : join(__dirname, 'path/to/function/folder/func2/index.ts'),
        func6 : join(__dirname, 'path/to/function/folder/func3/index.ts'),
    }
});
```
* rename `functionProps` to `functions`
* implement mutation to SQS
* implement mutation to SNS
* implement mutation to EventBridge
* write custom gql lambda transformer
* node client
* lambda utils
* 