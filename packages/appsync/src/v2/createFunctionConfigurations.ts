import {
  AmplifyGeneratedCfn,
  AmplifyGeneratedCfnResource,
  AppsyncResource,
  AppsyncResourceType,
  AppsyncSchemaTransformerProps,
  AwsResourceType,
} from '../datatypes';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { Construct } from 'constructs';
import { pascalCase } from 'change-case';
import { AppsyncSchemaTransformer } from '..';

export function createResolvers(
  scope: AppsyncSchemaTransformer
): AppsyncResource[] {
  const cfnResolvers = scope.findCfnResourcesByType(AwsResourceType.RESOLVER);
  const functionConfigs = cfnResolvers
    .map((cfnResolver) =>
      createSingleResolver(scope, cfnResolver.name, cfnResolver.cfn)
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
        cfnFunctionConfig.name,
        cfnFunctionConfig.cfn
      )
    )
    .flat();
  return functionConfigs;
}

export function createSingleResolver(
  scope: AppsyncSchemaTransformer,
  cfnName : string,
  cfnResource: AmplifyGeneratedCfnResource
): AppsyncResource[] {
  const { resources, cfn, api, props } = scope;
  const { FieldName, TypeName, Kind, PipelineConfig : { Functions }} = cfnResource.Properties;

  let construct, type;
  if (Kind === 'PIPELINE') {
    const pipelineConfig = Functions.map(func => {
      const name = func["Fn::GetAtt"][0];
      const { construct } = scope.findAppsyncResourcesByCfnName(name);
      return construct as aws_appsync.AppsyncFunction;
    });
    const resolverMappingTemplates = getResolverTemplates(
      scope,
      cfnResource
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
  cfnName : string,
  cfnResource: AmplifyGeneratedCfnResource
): AppsyncResource[] {
  const { resources, api, props } = scope;
  const functionName = cfnResource.Properties.Name;
  const resolverMappingTemplates = getResolverTemplates(
    scope,
    cfnResource
  );
  const dataSource = getDataSource(cfnResource, resources);
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
      cfnName
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

export function getResolverTemplates(
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
  cfnResource: AmplifyGeneratedCfnResource,
  resources: AppsyncResource[]
) {
  const dataSources = resources.filter(
    (f: AppsyncResource) => f.awsType === AwsResourceType.DATASOURCE
  );
  const dataSourceName = cfnResource.Properties.DataSourceName;
  let dataSource: aws_appsync.BaseDataSource;

  // TODO: optimize this search.  we can memoize
  if (dataSourceName.Ref && typeof dataSourceName.Ref === 'string') {
    dataSource = dataSources.find(
      (f: AppsyncResource) => f.type === AppsyncResourceType.NONE_DATASOURCE
    ).construct as aws_appsync.BaseDataSource;
  } else {
    const name = dataSourceName['Fn::GetAtt'][0];
    dataSource = dataSources.find((f: AppsyncResource) => f.name === name)
      .construct as aws_appsync.BaseDataSource;
  }

  if (!dataSource) {
    throw new Error(
      `getDataSource: No datasource found for DataSourceName ${JSON.stringify(
        dataSourceName
      )}`
    );
  }
  return dataSource;
}
