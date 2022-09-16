"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsResourceType = exports.AwsDataSourceType = void 0;
var AwsDataSourceType;
(function (AwsDataSourceType) {
    AwsDataSourceType["AWS_LAMBDA"] = "AWS_LAMBDA";
    AwsDataSourceType["AMAZON_DYNAMODB"] = "AMAZON_DYNAMODB";
    AwsDataSourceType["NONE"] = "NONE";
})(AwsDataSourceType = exports.AwsDataSourceType || (exports.AwsDataSourceType = {}));
var AwsResourceType;
(function (AwsResourceType) {
    AwsResourceType["DATASOURCE"] = "AWS::AppSync::DataSource";
    AwsResourceType["FUNCTION_CONFIGURATION"] = "AWS::AppSync::FunctionConfiguration";
    AwsResourceType["RESOLVER"] = "AWS::AppSync::Resolver";
    AwsResourceType["GRAPHQL_API"] = "AWS::AppSync::GraphQLApi";
    AwsResourceType["DYNAMO_TABLE"] = "AWS::DynamoDB::Table";
    AwsResourceType["LAMBDA_FUNCTION"] = "AWS::DynamoDB::Table";
    AwsResourceType["CUSTOM_RESOURCE"] = "CUSTOM_RESOURCE";
})(AwsResourceType = exports.AwsResourceType || (exports.AwsResourceType = {}));
//# sourceMappingURL=cfn.js.map