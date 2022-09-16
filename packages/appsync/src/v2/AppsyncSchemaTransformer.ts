/* eslint-disable @typescript-eslint/no-explicit-any */
import { Construct } from 'constructs';
import { NestedStack, aws_iam } from 'aws-cdk-lib';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { mkdir, mkdirSync, readFileSync, writeFileSync } from 'fs';
import {
  GraphQLTransform,
  TransformerPluginBase,
} from '@aws-amplify/graphql-transformer-core';
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
  ResourceByStackAndName,
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
import { getCloudFormation } from '../schema';

export class AppsyncSchemaTransformer extends NestedStack {
  resources: AppsyncResource[] = [];
  rotator?: AppsyncKeyRotator;
  api: aws_appsync.GraphqlApi;
  noneDataSource: aws_appsync.NoneDataSource;
  cfnResources: Record<string, AmplifyGeneratedCfnResource>;
  cfn: AmplifyGeneratedCfn;
  props: AppsyncSchemaTransformerProps;
  private _resourcesByStackAndName? : ResourceByStackAndName[] = [];

  findCfnResourcesByType(
    awsType: AwsResourceType
  ): ResourceByStackAndName[] {
    if(this._resourcesByStackAndName.length === 0) {
      this._resourcesByStackAndName = Object.entries(this.cfn.stacks).reduce((acc, value) => {
        const [stackName, stack] = value;
        const resources = Object.entries(stack.Resources).map(([name, cfn]: [name: string, cfn: AmplifyGeneratedCfnResource]) => ({
          stackName,
          name,
          cfn,
        }));
        return [...acc,...resources]
      }, []);
    }
    return this._resourcesByStackAndName.filter((resource) => {
      return resource.cfn.Type === awsType
    });
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
      console.warn("No auth config has been explicitly defined. A default API key has been created.")
      props.authorizationConfig = [{
        authType : AuthType.ApiKey,
        apiKeyConfig : {
          description : "Default API key.",
          expiresInDays : 365
        }
      }];
    }

    const { cfn, cfnResources } = getCloudFormation(props);
    this.props = props;
    this.cfn = cfn;
    this.cfnResources = cfnResources;

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
    this.addResources(createLambdaDataSource(this, this.props, this.api, this.cfn));

    console.info(3);
    this.addResources(createFuntionConfigurations(this));
    this.addResources(createResolvers(this));
    this.addResources(props.subscriptions?.map((name) => createSubscription(this, name)));
    
    // add custom domain name
    this.addResources(createPermissions(this, this.props, this.api, this.cfn, this.resources));
    
    // TODO: refactor the rest of the add resource calls like this
    createRotator(this);
  }
}

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
    mkdirSync(props.outputDirectory, {
      recursive : true
    });
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
