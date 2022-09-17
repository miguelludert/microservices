"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFunctionCode = exports.createLambdaResources = exports.createLambdaFunction = exports.createLambdaDataSource = exports.defaultFunctionProps = void 0;
const tslib_1 = require("tslib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_appsync = require("@aws-cdk/aws-appsync-alpha");
const datatypes_1 = require("../datatypes");
const change_case_1 = require("change-case");
const path_1 = require("path");
const esbuild = require("esbuild");
const fs_1 = require("fs");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const createApi_1 = require("./createApi");
// TODO: this is a strong candidate for migration to new transformer
exports.defaultFunctionProps = {
    runtime: aws_lambda_1.Runtime.NODEJS_16_X,
    handler: "handler"
};
const createLambdaDataSource = (scope, props, api, cfn) => {
    var _a;
    const resources = (_a = cfn.stacks['FunctionDirectiveStack']) === null || _a === void 0 ? void 0 : _a.Resources;
    if (!resources) {
        return null;
    }
    const resourcePairs = Object.values(resources);
    const result = resourcePairs.reduce((acc, cfn) => {
        if (cfn.Type === datatypes_1.AwsResourceType.DATASOURCE &&
            cfn.Properties.Type === datatypes_1.AwsDataSourceType.AWS_LAMBDA) {
            const resource = (0, exports.createLambdaResources)(scope, props, api, cfn);
            acc.push(...resource);
        }
        return acc;
    }, []);
    return result;
};
exports.createLambdaDataSource = createLambdaDataSource;
function createLambdaFunction(scope, props, functionName) {
    // functionName comes in as a pascalCase obj from cfn
    const functionPropKey = Object
        .keys(props.functionProps)
        .find(f => (0, change_case_1.pascalCase)(f) === functionName);
    if (!functionPropKey) {
        throw new Error(`Cannot find stack by name of '${functionName}'.`);
    }
    const functionOrEntryPoint = props.functionProps[functionPropKey];
    if (typeof (functionOrEntryPoint) === "string") {
        const _a = Object.assign(Object.assign({}, exports.defaultFunctionProps), props.defaultFunctionProps), { runtime, environment, handler, esbuildProps } = _a, restProps = tslib_1.__rest(_a, ["runtime", "environment", "handler", "esbuildProps"]);
        if (!props.outputDirectory) {
            throw new Error(`'props.outputDirectory' is required when creating lambda functions.`);
        }
        const code = buildFunctionCode(functionOrEntryPoint, (0, path_1.join)(props.outputDirectory, functionPropKey));
        return new aws_cdk_lib_1.aws_lambda.Function(scope, props.namingConvention(functionName), Object.assign(Object.assign({ code,
            runtime, handler: `index.${handler}` }, restProps), { environment: Object.assign(Object.assign({}, environment), { MS_API_URL_OUTPUT_NAME: (0, createApi_1.getGraphqlUrlOutputName)(props), MS_API_KEY_SECRET_NAME: (0, createApi_1.getSecretName)(props) }) }));
    }
    else {
        return functionOrEntryPoint;
    }
}
exports.createLambdaFunction = createLambdaFunction;
const createLambdaResources = (scope, props, api, cfn) => {
    const datasourceName = cfn.Properties.Name;
    const functionName = datasourceName.replace('LambdaDataSource', '');
    const lambdaFunction = createLambdaFunction(scope, props, functionName);
    const datasource = new aws_appsync.LambdaDataSource(scope, props.namingConvention(datasourceName), {
        api,
        lambdaFunction,
        name: datasourceName,
    });
    return [
        {
            type: datatypes_1.AppsyncResourceType.LAMBDA_FUNCTION,
            awsType: datatypes_1.AwsResourceType.LAMBDA_FUNCTION,
            name: functionName,
            construct: lambdaFunction,
        },
        {
            type: datatypes_1.AppsyncResourceType.LAMBDA_DATASOURCE,
            awsType: datatypes_1.AwsResourceType.DATASOURCE,
            name: datasourceName,
            construct: datasource,
        },
    ];
};
exports.createLambdaResources = createLambdaResources;
function buildFunctionCode(entryPoint, outDir) {
    if (!(0, fs_1.existsSync)(entryPoint)) {
        throw new Error(`buildFunctionCode: Cannot find function code. '${entryPoint}'`);
    }
    esbuild.buildSync({
        entryPoints: [entryPoint],
        bundle: true,
        sourcemap: true,
        platform: 'node',
        outfile: (0, path_1.join)(outDir, "index.js")
    });
    return aws_cdk_lib_1.aws_lambda.Code.fromAsset(outDir);
}
exports.buildFunctionCode = buildFunctionCode;
//# sourceMappingURL=lambda.js.map