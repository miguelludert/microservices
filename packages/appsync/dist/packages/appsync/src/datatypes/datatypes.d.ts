import { Construct } from 'constructs';
import { aws_cognito, aws_lambda } from 'aws-cdk-lib';
import { AmplifyGeneratedCfnResource, AwsResourceType } from './cfn';
import { FunctionOptions } from 'aws-cdk-lib/aws-lambda';
import { TableProps } from 'aws-cdk-lib/aws-dynamodb';
export declare const NO_SCHEMA_ERROR_MESSAGE = "Either 'schemaText' or a 'schemaFile' property is required.";
export declare const INVOKE_ON_PROPS_ERROR_MESSAGE = "'onProps' callback requires a return value.";
export declare enum AuthType {
    IAM = 0,
    USER_POOL = 1,
    LAMBDA = 2,
    ApiKey = 3
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
    functionProps?: Record<string, aws_lambda.Function | string>;
    subscriptions?: string[];
    customDomainName?: DomainConfig;
    apiKeyRotator?: boolean;
    defaultDynamoProps?: DefaultDynamoProps;
}
export declare type ResourceByStackAndName = {
    stackName: string;
    name: string;
    cfn: AmplifyGeneratedCfnResource;
};
export declare type DefaultDynamoProps = Partial<Omit<TableProps, "tableName" | "partitionKey" | "sortKey">>;
export interface DefaultFunctionProps extends FunctionOptions {
    runtime?: aws_lambda.Runtime;
    handler?: string;
    esbuildProps?: any;
}
export declare enum AppsyncResourceType {
    DYNAMO_DATASOURCE = 0,
    LAMBDA_DATASOURCE = 1,
    ELASTIC_SEARCH_DATASOURCE = 2,
    RDS_DATASOURCE = 3,
    NONE_DATASOURCE = 4,
    RESOLVER = 5,
    PIPELINE_RESOLVER = 6,
    FUNCTION_CONFIGURATION = 7,
    GRAPHQL_API = 8,
    DYNAMO_TABLE = 9,
    LAMBDA_FUNCTION = 10,
    API_KEY_ROTATOR = 11,
    CUSTOM_DOMAIN = 12
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
