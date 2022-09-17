import { Construct } from 'constructs';
import { aws_iam } from 'aws-cdk-lib';
import { AppsyncResource } from '../datatypes';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { AppsyncSchemaTransformer } from './AppsyncSchemaTransformer';
export interface AppsyncKeyRotatorProps {
    api: aws_appsync.GraphqlApi;
    region: string;
}
export declare class AppsyncKeyRotator extends Construct {
    private secret;
    constructor(scope: Construct, name: string, props: AppsyncKeyRotatorProps);
    grantRead(grantable: aws_iam.IGrantable): void;
}
export declare function createRotator(scope: AppsyncSchemaTransformer): AppsyncResource[];
