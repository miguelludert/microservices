import { Construct } from 'constructs';
import { Duration, aws_lambda, aws_secretsmanager, aws_iam } from 'aws-cdk-lib';
//import { cfnOutputs, functionProps, getDist } from '@thriving-artist/cdk-utils';
import {
  AppsyncSchemaTransformerProps,
  AmplifyGeneratedCfn,
  AppsyncResource,
  AppsyncResourceType,
  AwsResourceType,
} from '../datatypes';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { join } from 'path';
import { AppsyncSchemaTransformer } from './AppsyncSchemaTransformer';
import * as esbuild from 'esbuild';
import tmp from 'tmp';
import { cfnOutputs } from '../utils/cfn-outputs';

export interface AppsyncKeyRotatorProps {
  api: aws_appsync.GraphqlApi;
  region: string;
}

export class AppsyncKeyRotator extends Construct {
  private secret: aws_secretsmanager.Secret;

  constructor(scope: Construct, name: string, props: AppsyncKeyRotatorProps) {
    super(scope, name);
    const { api } = props;
    const namingConvention = (thisName : string) => `${name}-${thisName}`;
    const secret = new aws_secretsmanager.Secret(
      scope,
      namingConvention('secret'),
      {
        secretName: namingConvention('secret'),
      }
    );
    secret.secretValueFromJson(
      JSON.stringify({
        apiId: api.apiId,
        apiKey: api.apiKey,
        apiUrl: api.graphqlUrl,
        apiArn: api.arn,
      })
    );
    const outDir = tmp.dirSync();
    const outfile = join(outDir.name, 'index.js');
    const buildResult = esbuild.buildSync({
      entryPoints: [join(__dirname, 'api-key-rotator-handler.ts')],
      bundle: true,
      sourcemap: 'inline',
      platform: 'node',
      outfile,
    });

    if (buildResult.errors.length) {
      throw new Error(
        `AppsyncKeyRotator: ${buildResult.errors.length} errors on building 'api-key-rotator-handler.ts:\n\n${buildResult.errors[0]}'`
      );
    }

    const code = aws_lambda.Code.fromAsset(outDir.name);
    const rotator = new aws_lambda.Function(
      scope,
      namingConvention('function'),
      {
        functionName: name,
        handler: 'index.handler',
        runtime: aws_lambda.Runtime.NODEJS_14_X,
        code,
        environment: {
          API_ID: api.apiId,
          API_ARN: api.arn,
          API_URL: api.graphqlUrl,
        },
        initialPolicy: [
          new aws_iam.PolicyStatement({
            actions: ['appsync:CreateApiKey'],
            resources: ['*'],
            effect: aws_iam.Effect.ALLOW,
          }),
        ],
      }
    );
    secret.addRotationSchedule('RotationSchedule', {
      rotationLambda: rotator,
      automaticallyAfter: Duration.days(30),
    });
    secret.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'],
        principals: [
          new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        ],
      })
    );

    this.secret = secret;

    cfnOutputs(scope, {
      'secret-name': this.secret.secretName,
    }, namingConvention);
  }

  grantRead(grantable: aws_iam.IGrantable) {
    this.secret.grantRead(grantable);
  }
}

export function createRotator(
  scope: AppsyncSchemaTransformer
): AppsyncResource[] {
  if (!scope.props.apiKeyRotator) {
    return [];
  }
  const name = scope.props.namingConvention('api-key-rotator');
  const rotator = new AppsyncKeyRotator(
    scope,
    name,
    {
      api: scope.api,
      region: scope.region,
    }
  );
  scope.resources
    .filter((f) => f.type === AppsyncResourceType.LAMBDA_FUNCTION)
    .forEach((resource) => {
      const func = resource.construct as aws_lambda.Function;
      rotator.grantRead(func);
    });
  scope.rotator = rotator;
  scope.addResources([
    {
      type: AppsyncResourceType.API_KEY_ROTATOR,
      awsType: AwsResourceType.CUSTOM_RESOURCE,
      name,
      construct: rotator,
    },
  ]);

  // {
  //   type: AppsyncResourceType.API_KEY_ROTATOR,
  //   awsType: AwsResourceType.CUSTOM_RESOURCE,
  //   name,
  //   cfnName: name,
  //   construct: rotator
  // }

  return [];
}
