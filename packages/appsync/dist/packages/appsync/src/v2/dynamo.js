"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndex = exports.getDynamoAttributeProps = exports.createDynamoResource = exports.filterDynamoResources = exports.createDynamoDataSource = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const datatypes_1 = require("../datatypes");
const aws_dynamodb_1 = require("aws-cdk-lib/aws-dynamodb");
const createDynamoDataSource = (scope, props, api, cfn) => {
    const resources = (0, exports.filterDynamoResources)(cfn);
    const datasources = resources.map((resource) => (0, exports.createDynamoResource)(scope, props, api, resource));
    return datasources.flat();
};
exports.createDynamoDataSource = createDynamoDataSource;
const filterDynamoResources = (cfn) => {
    const resourcePairs = Object.values(cfn.stacks)
        .map((stack) => stack.Resources)
        .map(Object.entries)
        .flat(1);
    const result = resourcePairs
        .filter(([name, cfn]) => cfn.Type == datatypes_1.AwsResourceType.DYNAMO_TABLE)
        .map(([name, cfn]) => ({
        name,
        cfn,
    }));
    return result;
};
exports.filterDynamoResources = filterDynamoResources;
const createDynamoResource = (scope, props, api, { name, cfn }) => {
    const { namingConvention } = props;
    const { DeletionPolicy, KeySchema, AttributeDefinitions, LocalSecondaryIndexes, GlobalSecondaryIndexes, } = cfn.Properties;
    const table = new aws_cdk_lib_1.aws_dynamodb.Table(scope, props.namingConvention(name), Object.assign(Object.assign({ tableName: props.namingConvention(name), removalPolicy: DeletionPolicy, billingMode: aws_dynamodb_1.BillingMode.PAY_PER_REQUEST }, (0, exports.getDynamoAttributeProps)(KeySchema, AttributeDefinitions)), (props.defaultDynamoProps || {})));
    // TODO: this is fugly naming
    const datasourceName = `${name.replace('Table', '')}DataSource`;
    const datasource = api.addDynamoDbDataSource(namingConvention(datasourceName), table, {
        description: datasourceName,
        name: datasourceName,
    });
    (0, exports.getIndex)(AttributeDefinitions, GlobalSecondaryIndexes).map((index) => table.addGlobalSecondaryIndex(index));
    (0, exports.getIndex)(AttributeDefinitions, LocalSecondaryIndexes).map((index) => table.addLocalSecondaryIndex(index));
    const result = [
        {
            type: datatypes_1.AppsyncResourceType.DYNAMO_DATASOURCE,
            awsType: datatypes_1.AwsResourceType.DATASOURCE,
            name: datasourceName,
            construct: datasource,
        },
        {
            type: datatypes_1.AppsyncResourceType.DYNAMO_TABLE,
            awsType: datatypes_1.AwsResourceType.DYNAMO_TABLE,
            name,
            construct: table,
        },
    ];
    return result;
};
exports.createDynamoResource = createDynamoResource;
const getDynamoAttributeProps = (keySchema, attributeDefinitions) => {
    const result = {};
    const getAttributeTypes = (name) => {
        const attr = attributeDefinitions.find((x) => x.AttributeName == name);
        return {
            S: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING,
            N: aws_cdk_lib_1.aws_dynamodb.AttributeType.NUMBER,
            B: aws_cdk_lib_1.aws_dynamodb.AttributeType.BINARY,
        }[attr.AttributeType];
    };
    if (keySchema[0]) {
        result.partitionKey = {
            name: keySchema[0].AttributeName,
            type: getAttributeTypes(keySchema[0].AttributeName),
        };
    }
    if (keySchema[1]) {
        result.sortKey = {
            name: keySchema[1].AttributeName,
            type: getAttributeTypes(keySchema[1].AttributeName),
        };
    }
    return result;
};
exports.getDynamoAttributeProps = getDynamoAttributeProps;
const getIndex = (attributeDefinitions, indexes) => {
    if (indexes) {
        return indexes.map(({ IndexName, KeySchema, Projection }) => (Object.assign({ indexName: IndexName, projectionType: Projection && Projection.ProjectionType }, (0, exports.getDynamoAttributeProps)(KeySchema, attributeDefinitions))));
    }
    return [];
};
exports.getIndex = getIndex;
//# sourceMappingURL=dynamo.js.map