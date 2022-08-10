/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import { NestedStack, aws_iam } from 'aws-cdk-lib';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { readFileSync, writeFileSync } from 'fs';
import {
  GraphQLTransform,
  TransformerPluginBase,
} from '@aws-amplify/graphql-transformer-core';
import { FunctionTransformer } from '@aws-amplify/graphql-function-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import {
  AuthTransformer,
  AuthTransformerConfig,
} from '@aws-amplify/graphql-auth-transformer';
import {
  PrimaryKeyTransformer,
  IndexTransformer,
} from '@aws-amplify/graphql-index-transformer';
import { join } from 'path';
import { createApi } from './createApi';
import { createDynamoDataSource } from './dynamo';
import {
  AppsyncResource,
  AppsyncSchemaTransformerProps,
  AppsyncResourceType,
  AuthConfig,
  AuthType,
  AwsResourceType,
  AmplifyGeneratedCfn,
  AmplifyGeneratedCfnResource,
  DomainConfig,
} from '../datatypes';
import { createLambdaDataSource } from './lambda';
import { createPermissions } from './createPermissions';
import {
  createFuntionConfigurations,
  createResolvers,
} from './createFunctionConfigurations';
//import { cfnOutputs } from '@thriving-artist/cdk-utils';
import { AppsyncKeyRotator, createRotator } from './AppsyncKeyRotator';
import { cfnOutputs } from '../utils/cfn-outputs';

export class AppsyncSchemaTransformer extends NestedStack {
  resources: AppsyncResource[] = [];
  rotator?: AppsyncKeyRotator;
  api: aws_appsync.GraphqlApi;
  noneDataSource: aws_appsync.NoneDataSource;
  cfnResources: Record<string, AmplifyGeneratedCfnResource>;
  cfn: AmplifyGeneratedCfn;
  props: AppsyncSchemaTransformerProps;

  findCfnResourcesByType(
    awsType: AwsResourceType
  ): { name: string; cfn: AmplifyGeneratedCfnResource }[] {
    return Object.entries(this.cfnResources)
      .filter(
        ([name, cfn]: [name: string, cfn: AmplifyGeneratedCfnResource]) =>
          cfn.Type === awsType
      )
      .map(([name, cfn]: [name: string, cfn: AmplifyGeneratedCfnResource]) => ({
        name,
        cfn,
      }));
  }

  findAppsyncResourcesByCfnName(cfnName: string): AppsyncResource | undefined {
    return this.resources.find((f) => f.cfnName === cfnName);
  }

  addResources(resources : AppsyncResource[]) {
    this.resources = [...this.resources ?? [],... resources ?? []];
  }

  grantQuery(grantee: aws_iam.IGrantable, ...fields : string[]) { 
    return this.api.grantQuery(grantee, ...fields);
  }

  grantMutation(grantee: aws_iam.IGrantable, ...fields : string[]) { 
    return this.api.grantMutation(grantee, ...fields);
  }

  grantReadRotatorKey(grantee: aws_iam.IGrantable) {
    if(this.props.apiKeyRotator !== true) {
      throw new Error(`grantReadRotatorKey: Cannot add grant. 'props.apiKeyRotator' has not been set to true.`)
    }
    return this.rotator?.grantRead(grantee);
  }

  constructor(
    scope: Construct,
    name: string,
    props: AppsyncSchemaTransformerProps
  ) {
    super(scope, name);

    if (!props.authorizationConfig) {
      console.warn("No configuration has been explicitly defined. A default API key has been created.")
      props.authorizationConfig = [{
        authType : AuthType.ApiKey,
        apiKeyConfig : {
          description : "Default API key.",
          expiresInDays : 365
        }
      }];
    }

    const { gqlSchemaPath, subscriptions } = props;
    const schemaText = readFileSync(gqlSchemaPath, 'utf8');
    const authTransformerProps = getAuthTransformerProps(props);
    const transformers = [
      new ModelTransformer(),
      new AuthTransformer(authTransformerProps),
      new PrimaryKeyTransformer(),
      new IndexTransformer(),
      new FunctionTransformer(),
    ];

    this.props = props;
    this.cfn = transformSchema(schemaText, transformers);
    this.cfnResources = getCfnResources(this.cfn);

    writeOutputFiles(this.props, this.cfn);
    props.baseName = name;
    this.api = createApi(this, this.props, this.cfn);
    this.noneDataSource = createNoneDataSource(this.api);
    this.addResources([
      {
        type: AppsyncResourceType.GRAPHQL_API,
        awsType: AwsResourceType.GRAPHQL_API,
        name: this.api.name,
        construct: this.api,
      },
      {
        type: AppsyncResourceType.NONE_DATASOURCE,
        awsType: AwsResourceType.DATASOURCE,
        name: 'NoneDataSource',
        construct: this.noneDataSource,
      },
    ]);
    this.addResources(createDynamoDataSource(this, this.props, this.api, this.cfn));
    console.info(2);
    this.addResources(createLambdaDataSource(this, this.props, this.api, this.cfn));
    console.info(3);
    this.addResources(createFuntionConfigurations(this));
    console.info(4);
    this.addResources(createResolvers(this));
    console.info(5);
    this.addResources(subscriptions?.map((name) => createSubscription(this, name)));
    console.info(6);
    // add custom domain name
    this.addResources(createPermissions(this, this.props, this.api, this.cfn, this.resources));
    
    // TODO: refactor the rest of the add resource calls like this
    createRotator(this);
    cfnOutputs(this, {
      graphqlUrl: this.api.graphqlUrl,
    }, props.namingConvention);
  }
}

export const transformSchema = (
  schemaText: string,
  transformers: TransformerPluginBase[]
): AmplifyGeneratedCfn => {
  const gqlTransform = new GraphQLTransform({
    transformers,
  });

  // ugly hack, get rid of this
  const cfSchema = (gqlTransform.transform(schemaText) as any) as AmplifyGeneratedCfn;
  return cfSchema;
};

export const getCfnResources = (cfn: AmplifyGeneratedCfn) => {
  const allEntries = [
    ...Object.entries(cfn.rootStack['Resources']),
    ...Object.values(cfn.stacks)
      .map((stack) => Object.entries(stack.Resources))
      .flat(),
  ];
  return Object.fromEntries(allEntries);
};

export function writeOutputFiles(
  props: AppsyncSchemaTransformerProps,
  cfSchema: any
) {
  // output as soon as schemas are available for debugging
  if (props.outputDirectory) {
    writeFileSync(
      join(
        props.outputDirectory,
        props.outputCfnFileName ?? `${props.namingConvention('cfn')}.json`
      ),
      JSON.stringify(cfSchema, null, 2),
      'utf8'
    );
    writeFileSync(
      join(
        props.outputDirectory,
        props.outputGraphqlSchemaFileName ??
          `${props.namingConvention('gql')}.gql`
      ),
      cfSchema.schema,
      'utf8'
    );
  }
}

export function getAuthConfig(config: AuthConfig) {
  const make = (authenticationType, props) => ({
    authenticationType,
    ...props,
  });
  if (config.authType == AuthType.ApiKey) {
    return make('API_KEY', {
      apiKeyConfig: config,
    });
  } else if (config.authType == AuthType.USER_POOL) {
    return make('AMAZON_COGNITO_USER_POOLS', {
      userPoolConfig: {
        userPoolId: config.userPoolConfig.userPool.userPoolId,
      },
    });
  } else if (config.authType == AuthType.LAMBDA) {
    throw new Error('getAuthConfig: AuthLambdaConfig NOT IMPLEMENTED');
  } else if (config.authType == AuthType.IAM) {
    return make('AWS_IAM', {});
  } else {
    throw new Error('getAuthConfig: auth config must match an AuthType');
  }
}

export function getAuthTransformerProps(
  props: AppsyncSchemaTransformerProps
): AuthTransformerConfig | null {
  const [defaultTransformer, ...additionalTransformers] = props.authorizationConfig;
  const result = {
    authConfig: {
      defaultAuthentication: getAuthConfig(defaultTransformer),
      additionalAuthenticationProviders:
        additionalTransformers.map(getAuthConfig),
    },
  };
  return result;
}

export function createNoneDataSource(api: aws_appsync.GraphqlApi) {
  return api.addNoneDataSource('NONE');
}

export function createSubscription(
  scope: AppsyncSchemaTransformer,
  name: string
): AppsyncResource {
  const [typeName, fieldName] = name.split('.');
  return {
    type: AppsyncResourceType.RESOLVER,
    awsType: AwsResourceType.RESOLVER,
    name,
    construct: new aws_appsync.Resolver(
      scope,
      scope.props.namingConvention(`${name}-resolver`),
      {
        typeName,
        fieldName,
        api: scope.api,
        dataSource: scope.noneDataSource,
        requestMappingTemplate: aws_appsync.MappingTemplate.fromString(`{
        "version" : "2017-02-28",
        "payload" : $util.toJson($context.arguments.input)
      }`),
        responseMappingTemplate: aws_appsync.MappingTemplate.fromString(
          `$util.toJson($context.result)`
        ),
      }
    ),
  };
}

export function customDomainName(domainConfig?: DomainConfig) {
  throw new Error("Not implemented");
  //https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-appsync-domainname.html
  if (domainConfig) {
    domainConfig;
  }
}
