import { AmplifyGeneratedCfnResource, AppsyncResource, ResourceByStackAndName } from '../datatypes';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { AppsyncSchemaTransformer } from '..';
export declare function createResolvers(scope: AppsyncSchemaTransformer): AppsyncResource[];
export declare function createFuntionConfigurations(scope: AppsyncSchemaTransformer): AppsyncResource[];
export declare function createSingleResolver(scope: AppsyncSchemaTransformer, cfnName: string, cfnResource: ResourceByStackAndName): AppsyncResource[];
export declare function createSingleFunctionConfig(scope: AppsyncSchemaTransformer, cfnResource: ResourceByStackAndName): AppsyncResource[];
export declare function getResolverMappingTemplate(scope: AppsyncSchemaTransformer, location: any, template: any): aws_appsync.MappingTemplate;
export declare function getMappingTemplates(scope: AppsyncSchemaTransformer, cfnResource: AmplifyGeneratedCfnResource): {
    requestMappingTemplate: aws_appsync.MappingTemplate;
    responseMappingTemplate: aws_appsync.MappingTemplate;
};
export declare function getDataSource(scope: AppsyncSchemaTransformer, cfnResource: ResourceByStackAndName): aws_appsync.BaseDataSource;
