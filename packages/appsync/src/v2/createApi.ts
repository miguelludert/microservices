import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { Construct } from "constructs";
import {
  AppsyncSchemaTransformerProps,
  AuthConfig,
  AuthType,
} from '../datatypes/datatypes';
import {Duration, Expiration, SecretValue } from 'aws-cdk-lib';
import { tmpNameSync } from 'tmp';
import { writeFileSync } from 'fs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { cfnOutputs } from '../utils/cfn-outputs';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';


export const getSecretName = (props : AppsyncSchemaTransformerProps) => props.namingConvention('api-key-secret-name');
export const getGraphqlUrlOutputName = (props : AppsyncSchemaTransformerProps) => props.namingConvention('graphql-url');

export const createApi = (
  scope: Construct,
  props: AppsyncSchemaTransformerProps,
  cfnSchema: any
): aws_appsync.GraphqlApi => {    
  // ugly hack to get the schema into appsync
  const tempFileName = tmpNameSync() as string;
  writeFileSync(tempFileName, cfnSchema.schema, 'utf8');
  const [defaultConfig, ...additionalConfigs] = props.authorizationConfig;
  const name = props.namingConvention('graphql-api');
  const apiProps: aws_appsync.GraphqlApiProps = {
    name,
    authorizationConfig: {
      defaultAuthorization: getAuthorizationMode(defaultConfig),
      additionalAuthorizationModes:
        additionalConfigs.map(getAuthorizationMode),
    },
    schema : aws_appsync.Schema.fromAsset(tempFileName)
  };
  const result = new aws_appsync.GraphqlApi(scope, name, apiProps);

  let secretOutput : any = {};
  if(props.authorizationConfig.some(s => s.authType === AuthType.ApiKey)) {
    const secretName = getSecretName(props);
    secretOutput = {
      apiKeySecretName : secretName
    };
    new Secret(scope, 'api-key-secret', {
      secretName,
      secretStringValue : new SecretValue(result.apiKey!)
    });
  }

  cfnOutputs(scope, {
    ...secretOutput,
    graphqlUrl: result.graphqlUrl,
  }, props.namingConvention);

  return result;
};


export function getAuthorizationMode(
  config: AuthConfig
): aws_appsync.AuthorizationMode {
  if (config.authType == AuthType.ApiKey) {
    return {
      authorizationType: aws_appsync.AuthorizationType.API_KEY,
      apiKeyConfig : {
        description : config.apiKeyConfig.description,
        expires : Expiration.after(Duration.days(config.apiKeyConfig.expiresInDays)) 
	    }
    };
  } else if (config.authType == AuthType.USER_POOL) {
    return {
      authorizationType: aws_appsync.AuthorizationType.USER_POOL,
      userPoolConfig: {
        userPool: config.userPoolConfig.userPool,
        appIdClientRegex: config.userPoolConfig.userPoolClientId,
      },
    };
  } else if (config.authType == AuthType.LAMBDA) {
    throw new Error('getAuthConfig: AuthLambdaConfig NOT IMPLEMENTED');
  } else if (config.authType == AuthType.IAM) {
	  return {
		  authorizationType : aws_appsync.AuthorizationType.IAM
	  }
  } else {
    throw new Error(`Not supported: ${config.authType}`);
  }
}
