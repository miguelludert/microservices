import { Construct } from 'constructs';
import { NestedStack, aws_iam } from 'aws-cdk-lib';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { AppsyncResource, AppsyncSchemaTransformerProps, AuthConfig, AwsResourceType, AmplifyGeneratedCfn, DomainConfig, ResourceByStackAndName } from '../datatypes';
import { AppsyncKeyRotator } from './AppsyncKeyRotator';
export declare class AppsyncSchemaTransformer extends NestedStack {
    resources: AppsyncResource[];
    rotator?: AppsyncKeyRotator;
    api: aws_appsync.GraphqlApi;
    noneDataSource: aws_appsync.NoneDataSource;
    cfn: AmplifyGeneratedCfn;
    props: AppsyncSchemaTransformerProps;
    cfnResourcesByStackAndName?: ResourceByStackAndName[];
    findCfnResourcesByType(awsType: AwsResourceType): ResourceByStackAndName[];
    findAppsyncResourcesByCfnName(cfnName: string): AppsyncResource | undefined;
    addResources(resources: AppsyncResource[]): void;
    grantQuery(grantee: aws_iam.IGrantable, ...fields: string[]): aws_iam.Grant;
    grantMutation(grantee: aws_iam.IGrantable, ...fields: string[]): aws_iam.Grant;
    grantReadRotatorKey(grantee: aws_iam.IGrantable): void;
    constructor(scope: Construct, name: string, props: AppsyncSchemaTransformerProps);
}
export declare function writeOutputFiles(props: AppsyncSchemaTransformerProps, cfSchema: any): void;
export declare function getAuthConfig(config: AuthConfig): any;
export declare function createNoneDataSource(api: aws_appsync.GraphqlApi): aws_appsync.NoneDataSource;
export declare function createSubscription(scope: AppsyncSchemaTransformer, name: string): AppsyncResource;
export declare function customDomainName(domainConfig?: DomainConfig): void;
