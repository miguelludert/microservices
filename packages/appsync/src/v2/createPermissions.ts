import { Construct } from 'constructs';
import {
  AmplifyGeneratedCfn,
  AppsyncResource,
  AppsyncResourceType,
  AppsyncSchemaTransformerProps,
} from '../datatypes';
import { aws_lambda, aws_dynamodb } from 'aws-cdk-lib';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';

export function createPermissions(
  scope: Construct,
  props: AppsyncSchemaTransformerProps,
  api: aws_appsync.GraphqlApi,
  cfn: AmplifyGeneratedCfn,
  resources: AppsyncResource[]
): AppsyncResource[] {
  // give all lambdas access to all tables
  // TODO : consider more refined security here
  const tables = resources
    .filter((f) => f.type == AppsyncResourceType.DYNAMO_TABLE)
    .map((m) => m.construct as aws_dynamodb.Table);
  const lambdas = resources
    .filter((f) => f.type == AppsyncResourceType.LAMBDA_FUNCTION)
    .map((m) => m.construct as aws_lambda.Function);
  lambdas.forEach((lambda) =>
    tables.forEach((table) => {
      table.grantReadWriteData(lambda);
    })
  );
  return [];
}
