import { aws_dynamodb } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import {
  AppsyncResource,
  AmplifyGeneratedCfn,
  AppsyncSchemaTransformerProps,
  AmplifyGeneratedCfnResource,
  AwsResourceType,
  AppsyncResourceType
} from '../datatypes';

export const createDynamoDataSource = (
  scope: Construct,
  props: AppsyncSchemaTransformerProps,
  api: aws_appsync.GraphqlApi,
  cfn: AmplifyGeneratedCfn
): AppsyncResource[] => {
  const resources = filterDynamoResources(cfn);
  const datasources = resources.map((resource) =>
    createDynamoResource(scope, props, api, resource)
  );
  return datasources.flat();
};

export const filterDynamoResources = (cfn: AmplifyGeneratedCfn) => {
  const resourcePairs = Object.values(cfn.stacks)
    .map((stack) => stack.Resources)
    .map(Object.entries)
    .flat(1) as [string, AmplifyGeneratedCfnResource][];
  const result = resourcePairs
    .filter(
      ([name, cfn]: [string, AmplifyGeneratedCfnResource]) =>
        cfn.Type == AwsResourceType.DYNAMO_TABLE
    )
    .map(([name, cfn]: [string, AmplifyGeneratedCfnResource]) => ({
      name,
      cfn,
    }));
  return result;
};

export const createDynamoResource = (
  scope: Construct,
  props: AppsyncSchemaTransformerProps,
  api: aws_appsync.GraphqlApi,
  { name, cfn }: { name: string; cfn: AmplifyGeneratedCfnResource }
): AppsyncResource[] => {
  const { namingConvention } = props;
  const {
    DeletionPolicy,
    KeySchema,
    AttributeDefinitions,
    LocalSecondaryIndexes,
    GlobalSecondaryIndexes,
  } = cfn.Properties;
  const table = new aws_dynamodb.Table(scope, props.namingConvention(name), {
    tableName : props.namingConvention(name),
    ...getDynamoAttributeProps(KeySchema, AttributeDefinitions),
    removalPolicy: DeletionPolicy,
  });
  // TODO: this is fugly naming
  const datasourceName = `${name.replace('Table','')}DataSource`;
  const datasource = api.addDynamoDbDataSource(
    namingConvention(datasourceName),
    table,
    {
      description: datasourceName,
      name: datasourceName,
    }
  );
  getIndex(AttributeDefinitions, GlobalSecondaryIndexes).map((index) =>
    table.addGlobalSecondaryIndex(index),
  );
  getIndex(AttributeDefinitions, LocalSecondaryIndexes).map((index) =>
    table.addLocalSecondaryIndex(index),
  );
  const result: AppsyncResource[] = [
    {
      type: AppsyncResourceType.DYNAMO_DATASOURCE,
      awsType: AwsResourceType.DATASOURCE,
      name : datasourceName,
      construct: datasource,
    },
    {
      type: AppsyncResourceType.DYNAMO_TABLE,
      awsType: AwsResourceType.DYNAMO_TABLE,
      name,
      construct: table,
    },
  ];
  return result;
};

export const getDynamoAttributeProps = (keySchema, attributeDefinitions) => {
	const result : any = {};
	const getAttributeTypes = (name) => {
		const attr = attributeDefinitions.find((x) => x.AttributeName == name);
		return {
			S: aws_dynamodb.AttributeType.STRING,
			N: aws_dynamodb.AttributeType.NUMBER,
			B: aws_dynamodb.AttributeType.BINARY,
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

export const getIndex = (attributeDefinitions, indexes) => {
	if (indexes) {
		return indexes.map(({ IndexName, KeySchema, Projection }) => ({
			indexName: IndexName,
			projectionType: Projection && Projection.ProjectionType,
			...getDynamoAttributeProps(KeySchema, attributeDefinitions),
		}));
	}
	return [];
};