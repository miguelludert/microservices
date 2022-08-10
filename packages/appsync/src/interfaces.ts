// import { Construct,  } from "constructs";
// import { aws_iam } from 'aws-cdk-lib';
// import aws_appsync from '@aws-cdk/aws-appsync-alpha';
// import { TransformerModelBase } from "@aws-amplify/graphql-transformer-core";

// export interface I_ConstructSetupProps {
// 	onProps?: (scope: Construct, props: any, context: any) => any;
// 	onConstruct?: (scope: Construct, props: any, context: any) => any;
// 	environment?: {
// 		[key: string]: string;
// 	};
// }

// export interface I_ResolverSetupProps {
// 	[key: string]: {
// 		pipeline?: [string];
// 		requestTemplate?: [string];
// 		responseTemplate?: [string];
// 	};
// }

// export interface I_DatasourceProvider {
// 	getTransformer: (props: I_AppSyncGqlSchemaProps) => TransformerModelBase[];
// 	createResources: (
// 		scope: Construct,
// 		props: I_AppSyncGqlSchemaProps,
// 		api: aws_appsync.GraphqlApi,
// 		cfSchema: any,
// 	) => AppsyncResource[];
// }

// export interface I_AppSyncGqlSchemaProps {
// 	baseName?: string;
// 	environment?: {
// 		[key: string]: string;
// 	};
// 	resources?: {
// 		[key: string]: I_ConstructSetupProps;
// 	};
// 	context?: any;
// 	lambdaFunctionCodeDir?: string;
// 	lambdaFunctionName?: string;
// 	lambdaHandlerName?: string;
// 	lambdaRuntime?: string;
// 	lambdaInitialPolicies? : aws_iam.PolicyStatement[],
// 	namingConvention?: (resourceName: string, typeName: string) => string;
// 	schemaFile?: string;
// 	schemaText?: string;
// 	defaultsDirectory?: string;
// 	overridesDirectory?: string;
// 	defaults?: I_ConstructSetupProps;
// 	overrides?: I_ConstructSetupProps;
// 	datasourceProviders?: I_DatasourceProvider[];
// 	outputGraphqlSchemaFilePath?: string;
// 	outputCfnSchemaFilePath?: string;
// 	authorizationConfig?: aws_appsync.AuthorizationMode[];
// }

// export interface I_CreateConstructContext {
// 	resourceName: string;
// 	props: I_AppSyncGqlSchemaProps;
// 	[key: string]: any;
// }

// export interface RestApiGatewayProps {
// 	rootName: string;
// 	restApiId: string;
// 	rootResourceId: string;
// 	urlName : string;
// }