import { Duration, aws_lambda } from 'aws-cdk-lib';
import * as aws_appsync from '@aws-cdk/aws-appsync-alpha';
import { Construct } from 'constructs';
import {
  AppsyncResource,
  AwsResourceType,
  AppsyncSchemaTransformerProps,
  AmplifyGeneratedCfn,
  AmplifyGeneratedCfnResource,
  AwsDataSourceType,
  AppsyncResourceType,
  LambdaProps,
} from '../datatypes';
import { paramCase } from 'change-case';
import { join } from 'path';
import * as esbuild from 'esbuild';
import { existsSync, mkdir, mkdirSync } from 'fs';

// TODO: this is a strong candidate for migration to new transformer

export const createLambdaDataSource = (
  scope: Construct,
  props: AppsyncSchemaTransformerProps,
  api: aws_appsync.GraphqlApi,
  cfn: AmplifyGeneratedCfn
): AppsyncResource[] => {
  const resources = cfn.stacks['FunctionDirectiveStack']?.Resources;
  if (!resources) {
    return null;
  }
  const resourcePairs = Object.values(resources);
  const result = resourcePairs.reduce((acc, cfn) => {
    if (
      cfn.Type === AwsResourceType.DATASOURCE &&
      cfn.Properties.Type === AwsDataSourceType.AWS_LAMBDA
    ) {
      const resource = createLambdaResources(scope, props, api, cfn);
      acc.push(...resource);
    }
    return acc;
  }, []);
  return result as AppsyncResource[];
};

export function createLambdaFunctionProps(props: AppsyncSchemaTransformerProps, functionName : string) {
  let result;
  if (!props.defaultFunctionProps) {
    throw new Error('Prop `defaultLambdaProps` not set.');
  }

  const formattedFunctionName = paramCase(functionName);
  const explicitProps = props.functionProps?.[formattedFunctionName];
  if(explicitProps && typeof explicitProps !== "string") {
    result = explicitProps;
  } 
  if(typeof(props.defaultFunctionProps) === "function") {
    throw new Error("functionSetup: LambdaFunctionCallback not implemented")
  } else {
    const  {
      initialPolicies,
      codeDir,
      handlerName,
      runtime,
      environment,
      timeoutInSeconds
    } = props.defaultFunctionProps as LambdaProps;
    result  = Object.assign({}, result, {
      functionName : props.namingConvention(functionName),
      handler: handlerName || "index.handler",
      runtime: runtime || aws_lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(timeoutInSeconds || 3),
      environment,
      initialPolicy : initialPolicies
    }, result);
    if(!result.code) {
      let entryPoint;
      if(explicitProps && typeof explicitProps === "string") {
        entryPoint = explicitProps as string;
      } else {
        if(!codeDir) {
          throw new Error(`createLambdaFunctionProps: Props 'defaultFunctionProps.codeDir' or 'functionProps.${formattedFunctionName}' are required.`);
        }
        entryPoint = join(codeDir, formattedFunctionName, 'index.ts');
      }
      result.code = buildFunctionCode(entryPoint, join(props.outputDirectory, formattedFunctionName));
    }      
  }
  return result;
}

export const createLambdaResources = (
  scope: Construct,
  props: AppsyncSchemaTransformerProps,
  api: aws_appsync.GraphqlApi,
  cfn: AmplifyGeneratedCfnResource
): AppsyncResource[] => {
  const datasourceName = cfn.Properties.Name;
  const functionName = datasourceName.replace('LambdaDataSource', '');
  const lambdaProps = createLambdaFunctionProps(props, functionName);
  const lambdaFunction = new aws_lambda.Function(scope, props.namingConvention(functionName), lambdaProps);
  const datasource = new aws_appsync.LambdaDataSource(
    scope,
    props.namingConvention(datasourceName),
    {
      api,
      lambdaFunction,
      name: datasourceName,
    }
  );
  return [
    {
      type: AppsyncResourceType.LAMBDA_FUNCTION,
      awsType: AwsResourceType.LAMBDA_FUNCTION,
      name: functionName,
      construct: lambdaFunction,
    },
    {
      type: AppsyncResourceType.LAMBDA_DATASOURCE,
      awsType: AwsResourceType.DATASOURCE,
      name: datasourceName,
      construct: datasource,
    },
  ];
};

export function buildFunctionCode(entryPoint : string, outDir : string){ 
  if(!existsSync(entryPoint)) {
    throw new Error(`buildFunctionCode: Cannot find function code. '${entryPoint}'`);
  }
  
  // TODO: if NX use nx commands
  esbuild.buildSync({
    entryPoints : [entryPoint],
    bundle : true,
    sourcemap : true,
    platform : 'node',
    outfile : join(outDir, "index.js")
  });
  return aws_lambda.Code.fromAsset(outDir);
}