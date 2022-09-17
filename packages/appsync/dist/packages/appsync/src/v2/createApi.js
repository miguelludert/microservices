"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthorizationMode = exports.createApi = exports.getGraphqlUrlOutputName = exports.getSecretName = void 0;
const aws_appsync = require("@aws-cdk/aws-appsync-alpha");
const datatypes_1 = require("../datatypes/datatypes");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const tmp_1 = require("tmp");
const fs_1 = require("fs");
const aws_secretsmanager_1 = require("aws-cdk-lib/aws-secretsmanager");
const cfn_outputs_1 = require("../utils/cfn-outputs");
const getSecretName = (props) => props.namingConvention('api-key-secret-name');
exports.getSecretName = getSecretName;
const getGraphqlUrlOutputName = (props) => props.namingConvention('graphql-url');
exports.getGraphqlUrlOutputName = getGraphqlUrlOutputName;
const createApi = (scope, props, cfnSchema) => {
    // ugly hack to get the schema into appsync
    const tempFileName = (0, tmp_1.tmpNameSync)();
    (0, fs_1.writeFileSync)(tempFileName, cfnSchema.schema, 'utf8');
    const [defaultConfig, ...additionalConfigs] = props.authorizationConfig;
    const name = props.namingConvention('graphql-api');
    const apiProps = {
        name,
        authorizationConfig: {
            defaultAuthorization: getAuthorizationMode(defaultConfig),
            additionalAuthorizationModes: additionalConfigs.map(getAuthorizationMode),
        },
        schema: aws_appsync.Schema.fromAsset(tempFileName)
    };
    const result = new aws_appsync.GraphqlApi(scope, name, apiProps);
    let secretOutput = {};
    if (props.authorizationConfig.some(s => s.authType === datatypes_1.AuthType.ApiKey)) {
        const secretName = (0, exports.getSecretName)(props);
        secretOutput = {
            apiKeySecretName: secretName
        };
        new aws_secretsmanager_1.Secret(scope, 'api-key-secret', {
            secretName,
            secretStringValue: new aws_cdk_lib_1.SecretValue(result.apiKey)
        });
    }
    (0, cfn_outputs_1.cfnOutputs)(scope, Object.assign(Object.assign({}, secretOutput), { graphqlUrl: result.graphqlUrl }), props.namingConvention);
    return result;
};
exports.createApi = createApi;
function getAuthorizationMode(config) {
    if (config.authType == datatypes_1.AuthType.ApiKey) {
        return {
            authorizationType: aws_appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
                description: config.apiKeyConfig.description,
                expires: aws_cdk_lib_1.Expiration.after(aws_cdk_lib_1.Duration.days(config.apiKeyConfig.expiresInDays))
            }
        };
    }
    else if (config.authType == datatypes_1.AuthType.USER_POOL) {
        return {
            authorizationType: aws_appsync.AuthorizationType.USER_POOL,
            userPoolConfig: {
                userPool: config.userPoolConfig.userPool,
                appIdClientRegex: config.userPoolConfig.userPoolClientId,
            },
        };
    }
    else if (config.authType == datatypes_1.AuthType.LAMBDA) {
        throw new Error('getAuthConfig: AuthLambdaConfig NOT IMPLEMENTED');
    }
    else if (config.authType == datatypes_1.AuthType.IAM) {
        return {
            authorizationType: aws_appsync.AuthorizationType.IAM
        };
    }
    else {
        throw new Error(`Not supported: ${config.authType}`);
    }
}
exports.getAuthorizationMode = getAuthorizationMode;
//# sourceMappingURL=createApi.js.map