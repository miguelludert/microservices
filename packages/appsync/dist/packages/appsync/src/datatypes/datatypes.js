"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppsyncResourceType = exports.AuthType = exports.INVOKE_ON_PROPS_ERROR_MESSAGE = exports.NO_SCHEMA_ERROR_MESSAGE = void 0;
exports.NO_SCHEMA_ERROR_MESSAGE = "Either 'schemaText' or a 'schemaFile' property is required.";
exports.INVOKE_ON_PROPS_ERROR_MESSAGE = "'onProps' callback requires a return value.";
var AuthType;
(function (AuthType) {
    AuthType[AuthType["IAM"] = 0] = "IAM";
    AuthType[AuthType["USER_POOL"] = 1] = "USER_POOL";
    AuthType[AuthType["LAMBDA"] = 2] = "LAMBDA";
    AuthType[AuthType["ApiKey"] = 3] = "ApiKey";
})(AuthType = exports.AuthType || (exports.AuthType = {}));
var AppsyncResourceType;
(function (AppsyncResourceType) {
    AppsyncResourceType[AppsyncResourceType["DYNAMO_DATASOURCE"] = 0] = "DYNAMO_DATASOURCE";
    AppsyncResourceType[AppsyncResourceType["LAMBDA_DATASOURCE"] = 1] = "LAMBDA_DATASOURCE";
    AppsyncResourceType[AppsyncResourceType["ELASTIC_SEARCH_DATASOURCE"] = 2] = "ELASTIC_SEARCH_DATASOURCE";
    AppsyncResourceType[AppsyncResourceType["RDS_DATASOURCE"] = 3] = "RDS_DATASOURCE";
    AppsyncResourceType[AppsyncResourceType["NONE_DATASOURCE"] = 4] = "NONE_DATASOURCE";
    AppsyncResourceType[AppsyncResourceType["RESOLVER"] = 5] = "RESOLVER";
    AppsyncResourceType[AppsyncResourceType["PIPELINE_RESOLVER"] = 6] = "PIPELINE_RESOLVER";
    AppsyncResourceType[AppsyncResourceType["FUNCTION_CONFIGURATION"] = 7] = "FUNCTION_CONFIGURATION";
    AppsyncResourceType[AppsyncResourceType["GRAPHQL_API"] = 8] = "GRAPHQL_API";
    AppsyncResourceType[AppsyncResourceType["DYNAMO_TABLE"] = 9] = "DYNAMO_TABLE";
    AppsyncResourceType[AppsyncResourceType["LAMBDA_FUNCTION"] = 10] = "LAMBDA_FUNCTION";
    AppsyncResourceType[AppsyncResourceType["API_KEY_ROTATOR"] = 11] = "API_KEY_ROTATOR";
    AppsyncResourceType[AppsyncResourceType["CUSTOM_DOMAIN"] = 12] = "CUSTOM_DOMAIN";
})(AppsyncResourceType = exports.AppsyncResourceType || (exports.AppsyncResourceType = {}));
//# sourceMappingURL=datatypes.js.map