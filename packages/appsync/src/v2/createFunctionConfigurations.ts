import {
  AmplifyGeneratedCfn,
  AmplifyGeneratedCfnResource,
  AppsyncResource,
  AppsyncResourceType,
  AppsyncSchemaTransformerProps,
  AwsResourceType,
  ResourceByStackAndName,
} from '../datatypes';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { Construct } from 'constructs';
import { pascalCase } from 'change-case';
import { AppsyncSchemaTransformer } from '..';
//import { handler } from 'src/functions/apikey-rotator';
import { getResourceNameFromReference } from '../utils/getResourceReference';

export function createResolvers(
  scope: AppsyncSchemaTransformer
): AppsyncResource[] {
  const cfnResolvers = scope.findCfnResourcesByType(AwsResourceType.RESOLVER);
  const functionConfigs = cfnResolvers
    .map((cfnResolver) =>
      createSingleResolver(scope, cfnResolver.name, cfnResolver)
    )
    .flat();
  return functionConfigs;
}

export function createFuntionConfigurations(
  scope: AppsyncSchemaTransformer
): AppsyncResource[] {

  const cfnFunctionConfigs = scope.findCfnResourcesByType(AwsResourceType.FUNCTION_CONFIGURATION); 
  const functionConfigs = cfnFunctionConfigs
    .map((cfnFunctionConfig) =>
      createSingleFunctionConfig(
        scope,
        cfnFunctionConfig
      )
    )
    .flat();
  return functionConfigs;
}

export function createSingleResolver(
  scope: AppsyncSchemaTransformer,
  cfnName : string,
  cfnResource: ResourceByStackAndName
): AppsyncResource[] {
  const { resources, cfn, api, props } = scope;
  const { FieldName, TypeName, Kind, PipelineConfig : { Functions }} = cfnResource.cfn.Properties;
  let construct, type;
  if (Kind === 'PIPELINE') {
    const pipelineConfig = Functions.map(func => {
      let name : string = getResourceNameFromReference(cfn ,cfnResource.stackName, func);
      const { construct } = scope.findAppsyncResourcesByCfnName(name);
      return construct as aws_appsync.AppsyncFunction;
    });
    const resolverMappingTemplates = getMappingTemplates(
      scope,
      cfnResource.cfn
    );
    type = AppsyncResourceType.PIPELINE_RESOLVER;
    construct = new aws_appsync.Resolver(
      scope,
      props.namingConvention(`${TypeName}-${FieldName}-resolver`),
      {
        api,
        fieldName: FieldName,
        typeName: TypeName,
        pipelineConfig,
        ...resolverMappingTemplates,
      }
    );
  } else {
    //const dataSource = getDataSource(cfnResource, resources);
    throw new Error('Not implemented');
  }
  return [{
    type,
    awsType : AwsResourceType.RESOLVER,
    name : pascalCase(`${FieldName}Resolver`),
    construct
  }];
}

export function createSingleFunctionConfig(
  scope: AppsyncSchemaTransformer,
  cfnResource: ResourceByStackAndName
): AppsyncResource[] {
  const { resources, api, props } = scope;
  const functionName = cfnResource.cfn.Properties.Name;
  const resolverMappingTemplates = getMappingTemplates(
    scope,
    cfnResource.cfn
  );
  const dataSource = getDataSource(scope, cfnResource);
  const construct = new aws_appsync.AppsyncFunction(
    scope,
    props.namingConvention(functionName),
    {
      name: functionName,
      api,
      dataSource,
      ...resolverMappingTemplates,
    }
  );
  const result = [
    {
      type: AppsyncResourceType.FUNCTION_CONFIGURATION,
      awsType: AwsResourceType.FUNCTION_CONFIGURATION,
      name: functionName,
      construct,
      cfnName : cfnResource.name
    },
  ];
  return result;
}

const resolversRegex = /^\/resolvers\//;

export function getResolverMappingTemplate(
  scope : AppsyncSchemaTransformer,
  location: any,
  template: any
): aws_appsync.MappingTemplate {
  const FN_JOIN = 'Fn::Join';
  const { api, props, cfn : { resolvers } } = scope;
  let result: string;
  if (typeof template === 'string') {
    result = template;
  } else if (template) {
    const chunks = template[FN_JOIN][1];
    result = chunks.map(chunk => { 
      if(typeof chunk === "string") {
        return chunk;
      } else if(chunk.Ref) {
        if(chunk.Ref.endsWith('ApiId')) {
          return api.apiId;
        } else {
          return props.namingConvention(chunk.Ref);
        }
      } else {
        throw new Error(`getResolverMappingTemplate: Cannot parse resolver template: ${JSON.stringify(chunks)}`)
      }
    }).join('');
  } else if(typeof location === 'string') {
    result = location;
  } else {
    const resolverPath = location[FN_JOIN][1].pop();
    const resolversName = resolverPath.replace(resolversRegex, '');
    result = resolvers[resolversName];
  }

  if (!result) {
    throw new Error('getResolver: Result cannot be null or empty.');
  }

  return aws_appsync.MappingTemplate.fromString(result);
}

export function getMappingTemplates(
  scope : AppsyncSchemaTransformer,
  cfnResource: AmplifyGeneratedCfnResource
) {
  const {
    RequestMappingTemplateS3Location: requestLocation,
    RequestMappingTemplate: requestTemplate,
    ResponseMappingTemplateS3Location: responseLocation,
    ResponseMappingTemplate: responseTemplate,
  } = cfnResource.Properties;
  return {
    requestMappingTemplate: getResolverMappingTemplate(
      scope,
      requestLocation,
      requestTemplate
    ),
    responseMappingTemplate: getResolverMappingTemplate(
      scope,
      responseLocation,
      responseTemplate
    ),
  };
}

export function getDataSource(
  scope: AppsyncSchemaTransformer,
  cfnResource: ResourceByStackAndName
) {
  const dataSourceNameRef = cfnResource.cfn.Properties.DataSourceName;
  const dataSourceName = getResourceNameFromReference(scope.cfn, cfnResource.stackName, dataSourceNameRef);

  //TODO : create none data source that we can find by reference
  let dataSource : aws_appsync.BaseDataSource = scope.noneDataSource; 
  if(dataSourceName) {
    dataSource =  scope.resources.find((f) => f.name === dataSourceName).construct as aws_appsync.BaseDataSource;
    //dataSource = scope.findAppsyncResourcesByCfnName(dataSourceName).construct as aws_appsync.BaseDataSource;
    if (!dataSource) {
      throw new Error(
        `getDataSource: No datasource found for DataSourceName ${JSON.stringify(
          dataSourceName
        )}`
      );
    }
  }
  return dataSource;
}
