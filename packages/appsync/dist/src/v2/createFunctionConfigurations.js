"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataSource = exports.getMappingTemplates = exports.getResolverMappingTemplate = exports.createSingleFunctionConfig = exports.createSingleResolver = exports.createFuntionConfigurations = exports.createResolvers = void 0;
const datatypes_1 = require("../datatypes");
const aws_appsync = require("@aws-cdk/aws-appsync-alpha");
const change_case_1 = require("change-case");
//import { handler } from 'src/functions/apikey-rotator';
const getResourceReference_1 = require("../utils/getResourceReference");
function createResolvers(scope) {
    const cfnResolvers = scope.findCfnResourcesByType(datatypes_1.AwsResourceType.RESOLVER);
    const functionConfigs = cfnResolvers
        .map((cfnResolver) => createSingleResolver(scope, cfnResolver.name, cfnResolver))
        .flat();
    return functionConfigs;
}
exports.createResolvers = createResolvers;
function createFuntionConfigurations(scope) {
    const cfnFunctionConfigs = scope.findCfnResourcesByType(datatypes_1.AwsResourceType.FUNCTION_CONFIGURATION);
    const functionConfigs = cfnFunctionConfigs
        .map((cfnFunctionConfig) => createSingleFunctionConfig(scope, cfnFunctionConfig))
        .flat();
    return functionConfigs;
}
exports.createFuntionConfigurations = createFuntionConfigurations;
function createSingleResolver(scope, cfnName, cfnResource) {
    const { resources, cfn, api, props } = scope;
    const { FieldName, TypeName, Kind, PipelineConfig: { Functions } } = cfnResource.cfn.Properties;
    let construct, type;
    if (Kind === 'PIPELINE') {
        const pipelineConfig = Functions.map(func => {
            let name = (0, getResourceReference_1.getResourceNameFromReference)(cfn, cfnResource.stackName, func);
            const { construct } = scope.findAppsyncResourcesByCfnName(name);
            return construct;
        });
        const resolverMappingTemplates = getMappingTemplates(scope, cfnResource.cfn);
        type = datatypes_1.AppsyncResourceType.PIPELINE_RESOLVER;
        construct = new aws_appsync.Resolver(scope, props.namingConvention(`${TypeName}-${FieldName}-resolver`), Object.assign({ api, fieldName: FieldName, typeName: TypeName, pipelineConfig }, resolverMappingTemplates));
    }
    else {
        //const dataSource = getDataSource(cfnResource, resources);
        throw new Error('Not implemented');
    }
    return [{
            type,
            awsType: datatypes_1.AwsResourceType.RESOLVER,
            name: (0, change_case_1.pascalCase)(`${FieldName}Resolver`),
            construct
        }];
}
exports.createSingleResolver = createSingleResolver;
function createSingleFunctionConfig(scope, cfnResource) {
    const { resources, api, props } = scope;
    const functionName = cfnResource.cfn.Properties.Name;
    const resolverMappingTemplates = getMappingTemplates(scope, cfnResource.cfn);
    const dataSource = getDataSource(scope, cfnResource);
    const construct = new aws_appsync.AppsyncFunction(scope, props.namingConvention(functionName), Object.assign({ name: functionName, api,
        dataSource }, resolverMappingTemplates));
    const result = [
        {
            type: datatypes_1.AppsyncResourceType.FUNCTION_CONFIGURATION,
            awsType: datatypes_1.AwsResourceType.FUNCTION_CONFIGURATION,
            name: functionName,
            construct,
            cfnName: cfnResource.name
        },
    ];
    return result;
}
exports.createSingleFunctionConfig = createSingleFunctionConfig;
const resolversRegex = /^\/resolvers\//;
function getResolverMappingTemplate(scope, location, template) {
    const FN_JOIN = 'Fn::Join';
    const { api, props, cfn: { resolvers } } = scope;
    let result;
    if (typeof template === 'string') {
        result = template;
    }
    else if (template) {
        const chunks = template[FN_JOIN][1];
        result = chunks.map(chunk => {
            if (typeof chunk === "string") {
                return chunk;
            }
            else if (chunk.Ref) {
                if (chunk.Ref.endsWith('ApiId')) {
                    return api.apiId;
                }
                else {
                    return props.namingConvention(chunk.Ref);
                }
            }
            else {
                throw new Error(`getResolverMappingTemplate: Cannot parse resolver template: ${JSON.stringify(chunks)}`);
            }
        }).join('');
    }
    else if (typeof location === 'string') {
        result = location;
    }
    else {
        const resolverPath = location[FN_JOIN][1].pop();
        const resolversName = resolverPath.replace(resolversRegex, '');
        result = resolvers[resolversName];
    }
    if (!result) {
        throw new Error('getResolver: Result cannot be null or empty.');
    }
    return aws_appsync.MappingTemplate.fromString(result);
}
exports.getResolverMappingTemplate = getResolverMappingTemplate;
function getMappingTemplates(scope, cfnResource) {
    const { RequestMappingTemplateS3Location: requestLocation, RequestMappingTemplate: requestTemplate, ResponseMappingTemplateS3Location: responseLocation, ResponseMappingTemplate: responseTemplate, } = cfnResource.Properties;
    return {
        requestMappingTemplate: getResolverMappingTemplate(scope, requestLocation, requestTemplate),
        responseMappingTemplate: getResolverMappingTemplate(scope, responseLocation, responseTemplate),
    };
}
exports.getMappingTemplates = getMappingTemplates;
function getDataSource(scope, cfnResource) {
    const dataSourceNameRef = cfnResource.cfn.Properties.DataSourceName;
    const dataSourceName = (0, getResourceReference_1.getResourceNameFromReference)(scope.cfn, cfnResource.stackName, dataSourceNameRef);
    //TODO : create none data source that we can find by reference
    let dataSource = scope.noneDataSource;
    if (dataSourceName) {
        dataSource = scope.resources.find((f) => f.name === dataSourceName).construct;
        //dataSource = scope.findAppsyncResourcesByCfnName(dataSourceName).construct as aws_appsync.BaseDataSource;
        if (!dataSource) {
            throw new Error(`getDataSource: No datasource found for DataSourceName ${JSON.stringify(dataSourceName)}`);
        }
    }
    return dataSource;
}
exports.getDataSource = getDataSource;
//# sourceMappingURL=createFunctionConfigurations.js.map