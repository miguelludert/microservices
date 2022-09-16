import { Construct } from 'constructs';
import { AmplifyGeneratedCfn, AppsyncResource, AppsyncSchemaTransformerProps } from '../datatypes';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
export declare function createPermissions(scope: Construct, props: AppsyncSchemaTransformerProps, api: aws_appsync.GraphqlApi, cfn: AmplifyGeneratedCfn, resources: AppsyncResource[]): AppsyncResource[];
