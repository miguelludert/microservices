import { Construct } from 'constructs';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { AppsyncResource, AmplifyGeneratedCfn, AppsyncSchemaTransformerProps, AmplifyGeneratedCfnResource } from '../datatypes';
export declare const createDynamoDataSource: (scope: Construct, props: AppsyncSchemaTransformerProps, api: aws_appsync.GraphqlApi, cfn: AmplifyGeneratedCfn) => AppsyncResource[];
export declare const filterDynamoResources: (cfn: AmplifyGeneratedCfn) => {
    name: string;
    cfn: AmplifyGeneratedCfnResource;
}[];
export declare const createDynamoResource: (scope: Construct, props: AppsyncSchemaTransformerProps, api: aws_appsync.GraphqlApi, { name, cfn }: {
    name: string;
    cfn: AmplifyGeneratedCfnResource;
}) => AppsyncResource[];
export declare const getDynamoAttributeProps: (keySchema: any, attributeDefinitions: any) => any;
export declare const getIndex: (attributeDefinitions: any, indexes: any) => any;
