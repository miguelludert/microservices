/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AppsyncFunction,
  BaseDataSource,
  // CfnFunctionConfiguration,
  // CfnResolver,
  GraphqlApi,
  MappingTemplate,
  Resolver,
} from '@aws-cdk/aws-appsync-alpha';
import { Construct } from 'constructs';
import {
  AppsyncResource,
  AwsResourceType,
  AppsyncResourceType,
} from '../datatypes';
import { getResourceByName, tryCallback } from '../utils';

export const createResolversAndFunctionsFromSchema = (
  scope: Construct,
  props: any,
  api: GraphqlApi,
  cfnSchema: any,
  resources: AppsyncResource[]
) => {
  const { basic, pipeline } = Object.keys(
    cfnSchema.stackMapping
  ).reduce(
    (acc, resourceName: string) => {
      const resourceCfn = getResourceByName(cfnSchema, resourceName);
      if (resourceCfn && resourceCfn.Type === AwsResourceType.RESOLVER) {
        const { Kind } = resourceCfn.Properties;
        if (Kind === 'PIPELINE') {
          acc.pipeline.push({
            resolverCfn: resourceCfn,
            resolverName: resourceName,
          });
        } else {
          acc.basic.push({
            resolverCfn: resourceCfn,
            resolverName: resourceName,
          });
        }
      }
      return acc;
    },
    {
      basic: [],
      pipeline: [],
      subscription: [],
    }
  );
  basic.forEach(createBasicResolver(scope, props, api, resources, cfnSchema));
  pipeline.forEach(
    createPipelineResolver(scope, props, api, resources, cfnSchema)
  );
};

export const createBasicResolver =
  (
    scope: Construct,
    props: any,
    api: GraphqlApi,
    resources: AppsyncResource[],
    cfnSchema: any
  ) =>
  ({ resolverCfn }: { resolverCfn: any; resolverName: string }) => {
    const {
      DataSourceName,
      FieldName: fieldName,
      TypeName: typeName,
    } = resolverCfn.Properties;
    const requestMappingTemplateName = `${typeName}.${fieldName}.req.vtl`;
    const responseMappingTemplateName = `${typeName}.${fieldName}.res.vtl`;
    const dataSource = tryCallback(() => {
      let dataSourceName;


      console.info(1, DataSourceName);

      if (typeof DataSourceName === 'string') {
        dataSourceName = DataSourceName;
      } else {
        dataSourceName = DataSourceName['Fn::GetAtt'][0];
      }


      console.info(2);

      const myResource = resources.find(
        (f) =>
          f.awsType === AwsResourceType.DATASOURCE &&
          f.name === dataSourceName
      );
      return myResource.construct as BaseDataSource;
    }, `createBasicResolver: Resource not found.`);
    dataSource.createResolver({
      fieldName,
      typeName,
      requestMappingTemplate: MappingTemplate.fromString(
        cfnSchema.resolvers[requestMappingTemplateName]
      ),
      responseMappingTemplate: MappingTemplate.fromString(
        cfnSchema.resolvers[responseMappingTemplateName]
      ),
    });
  };


export const createPipelineResolver =
  (
    scope: Construct,
    props: any,
    api: GraphqlApi,
    resources: AppsyncResource[],
    cfnSchema: any
  ) =>
  ({
    resolverCfn,
    resolverName,
  }: {
    resolverCfn: any;
    resolverName: string;
  }) => {
    throw Error("not implemented");
//     const {
//       PipelineConfig: {
//         Functions: [
//           {
//             ['Fn::GetAtt']: [functionName],
//           },
//         ],
//       },
//       FieldName: fieldName,
//       TypeName: typeName,
//     } = resolverCfn.Properties;
//     const appsyncFunctionCfn = getResourceByName(cfnSchema, functionName);
//     const dataSourceName = appsyncFunctionCfn.Properties.DataSourceName;
//     const functionVersion = appsyncFunctionCfn.Properties.FunctionVersion;
//     const resolverRequestMappingTemplateName = `${typeName}.${fieldName}.req.vtl`;
//     const resolverResponseMappingTemplateName = `${typeName}.${fieldName}.res.vtl`;
//     const functionRequestMappingTemplateName = `${functionName}.req.vtl`;
//     const functionResponseMappingTemplateName = `${functionName}.res.vtl`;
//     const dataSource = resources.find(
//       (r) => r.name === dataSourceName
//     ).construct as BaseDataSource;
//     const type = AppsyncResourceType.FUNCTION_CONFIGURATION;
//     let functionConfiguration = resources.find(
//       (f) => f.type == type && f.name === functionName
//     )?.construct as CfnFunctionConfiguration;

//     if (!functionConfiguration) {
//       functionConfiguration = new CfnFunctionConfiguration(
//         scope,
//         props.namingConvention(functionName, ''),
//         {
//           name: functionName,
//           apiId: api.apiId,
//           dataSourceName,
//           functionVersion,
//           requestMappingTemplate:
//             cfnSchema.pipelineFunctions[functionRequestMappingTemplateName],
//           responseMappingTemplate:
//             cfnSchema.pipelineFunctions[functionResponseMappingTemplateName],
//         }
//       );
//       functionConfiguration.node.addDependency(dataSource);
//       resources.push({
//         type,
//         awsType: AwsResourceType.FUNCTION_CONFIGURATION,
//         name: functionName,
//         construct: functionConfiguration,
//       });
//     }

//     const resolver = new CfnResolver(
//       scope,
//       props.namingConvention(resolverName, ''),
//       {
//         apiId: api.apiId,
//         fieldName,
//         typeName,
//         kind: 'PIPELINE',
//         pipelineConfig: { functions: [functionConfiguration.attrFunctionId] },
//         requestMappingTemplate:
//           cfnSchema.resolvers[resolverRequestMappingTemplateName],
//         responseMappingTemplate:
//           cfnSchema.resolvers[resolverResponseMappingTemplateName],
//       }
//     );

//     resolver.node.addDependency(functionConfiguration);
//     resources.push({
//       type: AppsyncResourceType.PIPELINE_RESOLVER,
//       awsType: AwsResourceType.RESOLVER,
//       name: resolverName,
//       construct: resolver,
//     });
};
