import { Construct } from 'constructs';
import { aws_cognito, aws_lambda, aws_iam } from 'aws-cdk-lib';
import { AwsResourceType } from './cfn';
import { FunctionOptions } from 'aws-cdk-lib/aws-lambda';
import { TableProps } from 'aws-cdk-lib/aws-dynamodb';

export const NO_SCHEMA_ERROR_MESSAGE =
  "Either 'schemaText' or a 'schemaFile' property is required.";
export const INVOKE_ON_PROPS_ERROR_MESSAGE =
  "'onProps' callback requires a return value.";

export enum AuthType {
  IAM,
  USER_POOL,
  LAMBDA,
  ApiKey,
}

export interface AuthApiKeyConfig {
  description?: string;
  expiresInDays: number;
}

export interface AuthUserPoolConfig {
  userPool?: aws_cognito.IUserPool;
  userPoolClientId?: string;
}

export interface AuthConfig {
  authType: AuthType;
  apiKeyConfig?: AuthApiKeyConfig;
  userPoolConfig?: AuthUserPoolConfig;
}

export interface AppsyncSchemaTransformerProps {
  gqlSchemaPath: string;
  authorizationConfig?: AuthConfig[];
  outputGraphqlSchemaFileName?: string;
  outputCfnFileName?: string;
  outputDirectory?: string;
  namingConvention: (name: string) => string;
  baseName?: string;
  defaultFunctionProps?: DefaultFunctionProps;
  functionProps? : Record<string, aws_lambda.Function | string>;
  subscriptions?: string[];
  customDomainName? : DomainConfig;
  apiKeyRotator? : boolean;
  defaultDynamoProps?: DefaultDynamoProps;
}

export type DefaultDynamoProps = Partial<Omit<TableProps, "tableName" | "partitionKey" | "sortKey">>;

export interface DefaultFunctionProps extends FunctionOptions {
  runtime?: aws_lambda.Runtime;
  handler?: string;
  esbuildProps? : any;
}

export enum AppsyncResourceType {
  DYNAMO_DATASOURCE,
  LAMBDA_DATASOURCE,
  ELASTIC_SEARCH_DATASOURCE,
  RDS_DATASOURCE,
  NONE_DATASOURCE,
  RESOLVER,
  PIPELINE_RESOLVER,
  FUNCTION_CONFIGURATION,
  GRAPHQL_API,
  DYNAMO_TABLE,
  LAMBDA_FUNCTION,
  API_KEY_ROTATOR,
  CUSTOM_DOMAIN,
}

export interface AppsyncResource {
  type: AppsyncResourceType;
  awsType: AwsResourceType;
  name: string;
  cfnName?: string;
  construct: Construct;
}

export interface DomainConfig {
  CertificateArn: string;
  Description?: string;
  DomainName: string;
}
