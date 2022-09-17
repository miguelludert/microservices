import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { Construct } from "constructs";
import { AppsyncSchemaTransformerProps, AuthConfig } from '../datatypes/datatypes';
export declare const getSecretName: (props: AppsyncSchemaTransformerProps) => string;
export declare const getGraphqlUrlOutputName: (props: AppsyncSchemaTransformerProps) => string;
export declare const createApi: (scope: Construct, props: AppsyncSchemaTransformerProps, cfnSchema: any) => aws_appsync.GraphqlApi;
export declare function getAuthorizationMode(config: AuthConfig): aws_appsync.AuthorizationMode;
