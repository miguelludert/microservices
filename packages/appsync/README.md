# appsync

This library is intended to ease the speed and burden of developing a graphql API by bringing the AWS Amplify graphql transformers into CDK.  This allows us to create full appsync stacks, complete with lambda functions and dynamo tables with minimal code inside an existing robust Infrastructure-as-Code tool.  I've chosen NOT to use amplify directly and instead leverage the graphql transformers to be compatible with existing CDK projects, to minimize the number of tools necessary to build the project, and to keep IaC tool APIs consistent.

# Overview

This documentation follows the sample project in [https://github.com/miguelludert/microservices/tree/main/packages/sample-microservice]

Sample GQL schema
```
enum TodoStatusEnum  {
    New,
    Active,
    Complete,
    Deleted
}

type TodoTask @model @aws_api_key {
    id: ID!
    completedDate: AWSDateTime
    status: TodoStatusEnum
}

input TaskCompletedInput {
    id: ID!
    emailAddress: String!
}

input TaskCompletedResult {
    id: ID!
    emailAddress: String!
}

type Mutation @aws_api_key {
    shareTask(
        id: ID!
        emailAddress: String!
    ): Boolean
        @function(name: "share-task")
        @aws_api_key
}

```

Sample CDK
```
import { App, Stack } from 'aws-cdk-lib';
import { AppsyncSchemaTransformer } from '@miguelludert/appsync';
import { join } from 'path';
import { paramCase } from 'change-case';

const app = new App();
// core stack

const namingConvention = (name : string) => paramCase(`Demo${name}`);

class AppsyncStack extends Stack
{
    constructor(scope : App ,name : string) {
        super(scope,name);
        new AppsyncSchemaTransformer(this, namingConvention(`appsync`), {
            gqlSchemaPath : join(__dirname,'../schema.gql'),
            namingConvention,
            outputDirectory : join(__dirname,'../dist'),
            functionProps : {
                "share-task"  : join(__dirname, 'functions/share-task/index.ts')
            }
        });
    }
}   

new AppsyncStack(app, namingConvention('Stack'));
```

The code displayed does the following:
* Reads the GQL schema and transforms it to Cloudformation on the fly (no code generation).
* Deploys a Appsync Graphql API complete with queries, mutation, subscriptions and security.
* Builds, deploys a lambda function
* Integrates the lambda function into the Appsync instance. 

# Getting Started
