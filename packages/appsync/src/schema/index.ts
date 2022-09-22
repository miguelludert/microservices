import { AuthTransformer, AuthTransformerConfig } from "@aws-amplify/graphql-auth-transformer";
import { FunctionTransformer } from "@aws-amplify/graphql-function-transformer";
import { PrimaryKeyTransformer, IndexTransformer } from "@aws-amplify/graphql-index-transformer";
import { ModelTransformer } from "@aws-amplify/graphql-model-transformer";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { AmplifyGeneratedCfn, AppsyncSchemaTransformerProps, ResourceByStackAndName } from "../datatypes";
import { getAuthConfig } from "../v2/AppsyncSchemaTransformer";
import {
    HasOneTransformer,
    HasManyTransformer,
    ManyToManyTransformer,
    BelongsToTransformer
} from '@aws-amplify/graphql-relational-transformer'
import { GraphQLTransform, TransformerPluginBase } from "@aws-amplify/graphql-transformer-core";


export const tryCatch = (callback) => {
  try {
    return callback();
  } catch (e) {
     console.info(callback.toString());
     throw e;
  }
}

export const getCloudFormation = (props : AppsyncSchemaTransformerProps) => {
    const { gqlSchemaPath, subscriptions } = props;
    const schemaText = readFileSync(gqlSchemaPath, 'utf8');
    const authTransformerProps = tryCatch(() => getAuthTransformerProps(props));
    const model = tryCatch(() => new ModelTransformer());
    const auth = tryCatch(() => new AuthTransformer(authTransformerProps));
    const pkey = tryCatch(() => new PrimaryKeyTransformer());
    const index = tryCatch(() => new IndexTransformer());
    const func = tryCatch(() => new FunctionTransformer());
    const hasOne = tryCatch(() => new HasOneTransformer());
    const hasMany = tryCatch(() => new HasManyTransformer());
    const manyToMany = tryCatch(() => new ManyToManyTransformer(model,index,hasOne,auth));
    const transformers = [
        model,
        auth,
        pkey,
        index,
        func,
        hasOne,
        hasMany,
        manyToMany
    ];
    const cfn = transformSchema(schemaText, transformers);
    return cfn;
};

export const transformSchema = (
  schemaText: string,
  transformers: TransformerPluginBase[]
): AmplifyGeneratedCfn => {
  const gqlTransform = new GraphQLTransform({
    transformers,
    featureFlags :{
      getBoolean: (value: string, defaultValue: boolean): boolean => defaultValue,
      getNumber : (value: string, defaultValue: number): number => defaultValue,
      getObject : (value: string, defaultValue: any): any => defaultValue
    }
  });
  console.info(12);
  try
  {
    // ugly hack, get rid of this
    const cfSchema = (gqlTransform.transform(schemaText) as any) as AmplifyGeneratedCfn;
    console.info(13);
    return cfSchema;

  } catch (err) {
    console.error(err);
    throw err;
  }
};

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
