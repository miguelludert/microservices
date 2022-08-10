import { App, Stack } from 'aws-cdk-lib';
import { AppsyncSchemaTransformer } from '@miguelludert/appsync';
import { join } from 'path';
import { Construct } from 'constructs';
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
            namingConvention
        });
    }
}

new AppsyncStack(app, namingConvention('Stack'));
// appsync stack