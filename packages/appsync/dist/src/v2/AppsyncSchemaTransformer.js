"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customDomainName = exports.createSubscription = exports.createNoneDataSource = exports.getAuthConfig = exports.writeOutputFiles = exports.AppsyncSchemaTransformer = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_appsync = require("@aws-cdk/aws-appsync-alpha");
const fs_1 = require("fs");
const path_1 = require("path");
const createApi_1 = require("./createApi");
const dynamo_1 = require("./dynamo");
const datatypes_1 = require("../datatypes");
const lambda_1 = require("./lambda");
const createPermissions_1 = require("./createPermissions");
const createFunctionConfigurations_1 = require("./createFunctionConfigurations");
//import { cfnOutputs } from '@thriving-artist/cdk-utils';
const AppsyncKeyRotator_1 = require("./AppsyncKeyRotator");
const schema_1 = require("../schema");
const getCfnResources_1 = require("./getCfnResources");
class AppsyncSchemaTransformer extends aws_cdk_lib_1.NestedStack {
    constructor(scope, name, props) {
        var _a;
        super(scope, name);
        this.resources = [];
        this.cfnResourcesByStackAndName = [];
        if (!props.authorizationConfig) {
            console.warn("No auth config has been explicitly defined. A default API key has been created.");
            props.authorizationConfig = [{
                    authType: datatypes_1.AuthType.ApiKey,
                    apiKeyConfig: {
                        description: "Default API key.",
                        expiresInDays: 365
                    }
                }];
        }
        this.props = props;
        this.cfn = (0, schema_1.getCloudFormation)(props);
        this.cfnResourcesByStackAndName = (0, getCfnResources_1.getCfnResourcesByStackAndName)(this.cfn);
        props.baseName = name;
        this.api = (0, createApi_1.createApi)(this, this.props, this.cfn);
        this.noneDataSource = createNoneDataSource(this.api);
        this.addResources([
            {
                type: datatypes_1.AppsyncResourceType.GRAPHQL_API,
                awsType: datatypes_1.AwsResourceType.GRAPHQL_API,
                name: this.api.name,
                construct: this.api,
            },
            {
                type: datatypes_1.AppsyncResourceType.NONE_DATASOURCE,
                awsType: datatypes_1.AwsResourceType.DATASOURCE,
                name: 'NoneDataSource',
                construct: this.noneDataSource,
            },
        ]);
        this.addResources((0, dynamo_1.createDynamoDataSource)(this, this.props, this.api, this.cfn));
        this.addResources((0, lambda_1.createLambdaDataSource)(this, this.props, this.api, this.cfn));
        this.addResources((0, createFunctionConfigurations_1.createFuntionConfigurations)(this));
        this.addResources((0, createFunctionConfigurations_1.createResolvers)(this));
        this.addResources((_a = props.subscriptions) === null || _a === void 0 ? void 0 : _a.map((name) => createSubscription(this, name)));
        // add custom domain name
        this.addResources((0, createPermissions_1.createPermissions)(this, this.props, this.api, this.cfn, this.resources));
        // TODO: refactor the rest of the add resource calls like this
        (0, AppsyncKeyRotator_1.createRotator)(this);
    }
    findCfnResourcesByType(awsType) {
        return this.cfnResourcesByStackAndName.filter((resource) => {
            return resource.cfn.Type === awsType;
        });
    }
    findAppsyncResourcesByCfnName(cfnName) {
        return this.resources.find((f) => f.cfnName === cfnName);
    }
    addResources(resources) {
        var _a;
        this.resources = [...(_a = this.resources) !== null && _a !== void 0 ? _a : [], ...resources !== null && resources !== void 0 ? resources : []];
    }
    grantQuery(grantee, ...fields) {
        return this.api.grantQuery(grantee, ...fields);
    }
    grantMutation(grantee, ...fields) {
        return this.api.grantMutation(grantee, ...fields);
    }
    grantReadRotatorKey(grantee) {
        var _a;
        if (this.props.apiKeyRotator !== true) {
            throw new Error(`grantReadRotatorKey: Cannot add grant. 'props.apiKeyRotator' has not been set to true.`);
        }
        return (_a = this.rotator) === null || _a === void 0 ? void 0 : _a.grantRead(grantee);
    }
}
exports.AppsyncSchemaTransformer = AppsyncSchemaTransformer;
function writeOutputFiles(props, cfSchema) {
    var _a, _b;
    // output as soon as schemas are available for debugging
    if (props.outputDirectory) {
        (0, fs_1.mkdirSync)(props.outputDirectory, {
            recursive: true
        });
        (0, fs_1.writeFileSync)((0, path_1.join)(props.outputDirectory, (_a = props.outputCfnFileName) !== null && _a !== void 0 ? _a : `${props.namingConvention('cfn')}.json`), JSON.stringify(cfSchema, null, 2), 'utf8');
        (0, fs_1.writeFileSync)((0, path_1.join)(props.outputDirectory, (_b = props.outputGraphqlSchemaFileName) !== null && _b !== void 0 ? _b : `${props.namingConvention('gql')}.gql`), cfSchema.schema, 'utf8');
    }
}
exports.writeOutputFiles = writeOutputFiles;
function getAuthConfig(config) {
    const make = (authenticationType, props) => (Object.assign({ authenticationType }, props));
    if (config.authType == datatypes_1.AuthType.ApiKey) {
        return make('API_KEY', {
            apiKeyConfig: config,
        });
    }
    else if (config.authType == datatypes_1.AuthType.USER_POOL) {
        return make('AMAZON_COGNITO_USER_POOLS', {
            userPoolConfig: {
                userPoolId: config.userPoolConfig.userPool.userPoolId,
            },
        });
    }
    else if (config.authType == datatypes_1.AuthType.LAMBDA) {
        throw new Error('getAuthConfig: AuthLambdaConfig NOT IMPLEMENTED');
    }
    else if (config.authType == datatypes_1.AuthType.IAM) {
        return make('AWS_IAM', {});
    }
    else {
        throw new Error('getAuthConfig: auth config must match an AuthType');
    }
}
exports.getAuthConfig = getAuthConfig;
function createNoneDataSource(api) {
    return api.addNoneDataSource('NONE');
}
exports.createNoneDataSource = createNoneDataSource;
function createSubscription(scope, name) {
    const [typeName, fieldName] = name.split('.');
    return {
        type: datatypes_1.AppsyncResourceType.RESOLVER,
        awsType: datatypes_1.AwsResourceType.RESOLVER,
        name,
        construct: new aws_appsync.Resolver(scope, scope.props.namingConvention(`${name}-resolver`), {
            typeName,
            fieldName,
            api: scope.api,
            dataSource: scope.noneDataSource,
            requestMappingTemplate: aws_appsync.MappingTemplate.fromString(`{
        "version" : "2017-02-28",
        "payload" : $util.toJson($context.arguments.input)
      }`),
            responseMappingTemplate: aws_appsync.MappingTemplate.fromString(`$util.toJson($context.result)`),
        }),
    };
}
exports.createSubscription = createSubscription;
function customDomainName(domainConfig) {
    throw new Error("Not implemented");
    //https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-appsync-domainname.html
    if (domainConfig) {
        domainConfig;
    }
}
exports.customDomainName = customDomainName;
//# sourceMappingURL=AppsyncSchemaTransformer.js.map