export enum AwsDataSourceType {
  AWS_LAMBDA = "AWS_LAMBDA",
  AMAZON_DYNAMODB = "AMAZON_DYNAMODB",
  NONE = "NONE",
}

export enum AwsResourceType {
  DATASOURCE = "AWS::AppSync::DataSource",
  FUNCTION_CONFIGURATION = "AWS::AppSync::FunctionConfiguration",
  RESOLVER = "AWS::AppSync::Resolver",
  GRAPHQL_API = "AWS::AppSync::GraphQLApi",
  DYNAMO_TABLE = "AWS::DynamoDB::Table",
  LAMBDA_FUNCTION = "AWS::DynamoDB::Table",
  CUSTOM_RESOURCE = "CUSTOM_RESOURCE",
}

export interface AmplifyGeneratedCfnResource {
  Type: AwsResourceType;
  DependsOn?: string[];
  Properties?: {
    Type?: AwsDataSourceType;
    Name?: string;
    AttributeDefinitions?: any;
    LocalSecondaryIndexes?: any;
    GlobalSecondaryIndexes?: any;
    DeletionPolicy?: any;
    KeySchema?: any;
    DataSourceName?: any;
    RequestMappingTemplateS3Location?: any;
    ResponseMappingTemplateS3Location?: any;
    RequestMappingTemplate?: any;
    ResponseMappingTemplate?: any;
    DependsOn?: any;
    Kind?: string;
    FieldName?: string;
    TypeName?: string;
    PipelineConfig?: {
      Functions: any[];
    };
  };
}

export interface CfnStack {
  Resources?: Record<string,AmplifyGeneratedCfnResource>;
  Parameters? : Record<string,{ 
    Type : string;
  } | {
    "Fn::GetAtt" : string[]
  }>;
  Output? : Record<string,any>;
}

export interface AmplifyGeneratedCfn {
  rootStack?: Record<string, CfnStack>;
  resolvers?: {
    [key: string]: string;
  };
  stacks?: Record<string, CfnStack>;
}
