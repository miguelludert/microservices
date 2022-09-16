"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeOutputFiles = exports.getAuthTransformerProps = exports.transformSchema = exports.getCloudFormation = exports.tryCatch = void 0;
const graphql_auth_transformer_1 = require("@aws-amplify/graphql-auth-transformer");
const graphql_function_transformer_1 = require("@aws-amplify/graphql-function-transformer");
const graphql_index_transformer_1 = require("@aws-amplify/graphql-index-transformer");
const graphql_model_transformer_1 = require("@aws-amplify/graphql-model-transformer");
const fs_1 = require("fs");
const path_1 = require("path");
const AppsyncSchemaTransformer_1 = require("../v2/AppsyncSchemaTransformer");
const graphql_relational_transformer_1 = require("@aws-amplify/graphql-relational-transformer");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const tryCatch = (callback) => {
    try {
        return callback();
    }
    catch (e) {
        console.info(callback.toString());
        throw e;
    }
};
exports.tryCatch = tryCatch;
const getCloudFormation = (props) => {
    const { gqlSchemaPath, subscriptions } = props;
    const schemaText = (0, fs_1.readFileSync)(gqlSchemaPath, 'utf8');
    const authTransformerProps = (0, exports.tryCatch)(() => getAuthTransformerProps(props));
    const model = (0, exports.tryCatch)(() => new graphql_model_transformer_1.ModelTransformer());
    const auth = (0, exports.tryCatch)(() => new graphql_auth_transformer_1.AuthTransformer(authTransformerProps));
    const pkey = (0, exports.tryCatch)(() => new graphql_index_transformer_1.PrimaryKeyTransformer());
    const index = (0, exports.tryCatch)(() => new graphql_index_transformer_1.IndexTransformer());
    const func = (0, exports.tryCatch)(() => new graphql_function_transformer_1.FunctionTransformer());
    const hasOne = (0, exports.tryCatch)(() => new graphql_relational_transformer_1.HasOneTransformer());
    const hasMany = (0, exports.tryCatch)(() => new graphql_relational_transformer_1.HasManyTransformer());
    const manyToMany = (0, exports.tryCatch)(() => new graphql_relational_transformer_1.ManyToManyTransformer(model, index, hasOne, auth));
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
    const cfn = (0, exports.transformSchema)(schemaText, transformers);
    return cfn;
};
exports.getCloudFormation = getCloudFormation;
const transformSchema = (schemaText, transformers) => {
    const gqlTransform = new graphql_transformer_core_1.GraphQLTransform({
        transformers,
        featureFlags: {
            getBoolean: (value, defaultValue) => defaultValue,
            getNumber: (value, defaultValue) => defaultValue,
            getObject: (value, defaultValue) => defaultValue
        }
    });
    // ugly hack, get rid of this
    const cfSchema = gqlTransform.transform(schemaText);
    return cfSchema;
};
exports.transformSchema = transformSchema;
function getAuthTransformerProps(props) {
    const [defaultTransformer, ...additionalTransformers] = props.authorizationConfig;
    const result = {
        authConfig: {
            defaultAuthentication: (0, AppsyncSchemaTransformer_1.getAuthConfig)(defaultTransformer),
            additionalAuthenticationProviders: additionalTransformers.map(AppsyncSchemaTransformer_1.getAuthConfig),
        },
    };
    return result;
}
exports.getAuthTransformerProps = getAuthTransformerProps;
function writeOutputFiles(props, cfSchema) {
    var _a, _b;
    // output as soon as schemas are available for debugging
    if (props.outputDirectory) {
        (0, fs_1.mkdirSync)(props.outputDirectory, {
            recursive: true
        });
        (0, fs_1.writeFileSync)((0, path_1.join)(props.outputDirectory, (_a = props.outputCfnFileName) !== null && _a !== void 0 ? _a : `${props.namingConvention('cfn')}.json`), JSON.stringify(cfSchema, null, 2), 'utf8');
        (0, fs_1.writeFileSync)((0, path_1.join)(props.outputDirectory, (_b = props.outputGraphqlSchemaFileName) !== null && _b !== void 0 ? _b : `${props.namingConvention('gql')}.gql`), cfSchema.schema, 'utf8');
    }
}
exports.writeOutputFiles = writeOutputFiles;
//# sourceMappingURL=index.js.map