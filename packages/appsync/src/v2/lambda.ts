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
  DefultFunctionProps
} from '../datatypes';
import { paramCase, pascalCase } from 'change-case';
import { join } from 'path';
import * as esbuild from 'esbuild';
import { existsSync, mkdir, mkdirSync } from 'fs';
import { Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ifError } from 'assert';

// TODO: this is a strong candidate for migration to new transformer

export const defaultFunctionProps : DefultFunctionProps = {
  runtime : Runtime.NODEJS_16_X,
  handler : "handler"
};

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

export function createLambdaFunction(scope : Construct, props: AppsyncSchemaTransformerProps, functionName : string) : Function {

  // functionName comes in as a pascalCase obj from cfn
  const functionPropKey = Object
    .keys(props.functionProps)
    .find(f => pascalCase(f) === functionName);

  if(!functionPropKey) {
    throw new Error(`Cannot find stack by name of '${functionName}'.`)
  }

  const functionOrEntryPoint = props.functionProps[functionPropKey];

  if(typeof(functionOrEntryPoint) === "string") {
    const defaultProps = {
      ...defaultFunctionProps,
      ...props.defaultFunctionProps,
    };
    const  {
      runtime,
      environment,
      handler,
      esbuildProps,
      ...restProps
    } = defaultProps;

    console.info("sdfsadf: " +  props.outputDirectory);
    if(!props.outputDirectory) { 
      throw new Error(`'props.outputDirectory' is required when creating lambda functions.`)
    }

    const code = buildFunctionCode(functionOrEntryPoint, join(props.outputDirectory, functionPropKey));
    return new aws_lambda.Function(scope, props.namingConvention(functionName), {
      code,
      runtime,
      handler : `index.${handler}`,
      ...restProps
    });
  } else {
    return functionOrEntryPoint;    
  }
}

export const createLambdaResources = (
  scope: Construct,
  props: AppsyncSchemaTransformerProps,
  api: aws_appsync.GraphqlApi,
  cfn: AmplifyGeneratedCfnResource
): AppsyncResource[] => {
  const datasourceName = cfn.Properties.Name;
  const functionName = datasourceName.replace('LambdaDataSource', '');
  const lambdaFunction = createLambdaFunction(scope, props, functionName);
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
  
  esbuild.buildSync({
    entryPoints : [entryPoint],
    bundle : true,
    sourcemap : true,
    platform : 'node',
    outfile : join(outDir, "index.js")
  });
  return aws_lambda.Code.fromAsset(outDir);
}