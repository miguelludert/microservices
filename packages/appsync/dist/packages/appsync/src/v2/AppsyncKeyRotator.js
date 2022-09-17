"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRotator = exports.AppsyncKeyRotator = void 0;
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const datatypes_1 = require("../datatypes");
const path_1 = require("path");
const esbuild = require("esbuild");
const tmp_1 = require("tmp");
const cfn_outputs_1 = require("../utils/cfn-outputs");
class AppsyncKeyRotator extends constructs_1.Construct {
    constructor(scope, name, props) {
        super(scope, name);
        const { api } = props;
        const namingConvention = (thisName) => `${name}-${thisName}`;
        const secret = new aws_cdk_lib_1.aws_secretsmanager.Secret(scope, namingConvention('secret'), {
            secretName: namingConvention('secret'),
        });
        secret.secretValueFromJson(JSON.stringify({
            apiId: api.apiId,
            apiKey: api.apiKey,
            apiUrl: api.graphqlUrl,
            apiArn: api.arn,
        }));
        const outDir = tmp_1.default.dirSync();
        const outfile = (0, path_1.join)(outDir.name, 'index.js');
        const buildResult = esbuild.buildSync({
            entryPoints: [(0, path_1.join)(__dirname, 'api-key-rotator-handler.ts')],
            bundle: true,
            sourcemap: 'inline',
            platform: 'node',
            outfile,
        });
        if (buildResult.errors.length) {
            throw new Error(`AppsyncKeyRotator: ${buildResult.errors.length} errors on building 'api-key-rotator-handler.ts:\n\n${buildResult.errors[0]}'`);
        }
        const code = aws_cdk_lib_1.aws_lambda.Code.fromAsset(outDir.name);
        const rotator = new aws_cdk_lib_1.aws_lambda.Function(scope, namingConvention('function'), {
            functionName: name,
            handler: 'index.handler',
            runtime: aws_cdk_lib_1.aws_lambda.Runtime.NODEJS_14_X,
            code,
            environment: {
                API_ID: api.apiId,
                API_ARN: api.arn,
                API_URL: api.graphqlUrl,
            },
            initialPolicy: [
                new aws_cdk_lib_1.aws_iam.PolicyStatement({
                    actions: ['appsync:CreateApiKey'],
                    resources: ['*'],
                    effect: aws_cdk_lib_1.aws_iam.Effect.ALLOW,
                }),
            ],
        });
        secret.addRotationSchedule('RotationSchedule', {
            rotationLambda: rotator,
            automaticallyAfter: aws_cdk_lib_1.Duration.days(30),
        });
        secret.addToResourcePolicy(new aws_cdk_lib_1.aws_iam.PolicyStatement({
            effect: aws_cdk_lib_1.aws_iam.Effect.ALLOW,
            actions: ['secretsmanager:GetSecretValue'],
            resources: ['*'],
            principals: [
                new aws_cdk_lib_1.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
            ],
        }));
        this.secret = secret;
        (0, cfn_outputs_1.cfnOutputs)(scope, {
            'secret-name': this.secret.secretName,
        }, namingConvention);
    }
    grantRead(grantable) {
        this.secret.grantRead(grantable);
    }
}
exports.AppsyncKeyRotator = AppsyncKeyRotator;
function createRotator(scope) {
    if (!scope.props.apiKeyRotator) {
        return [];
    }
    const name = scope.props.namingConvention('api-key-rotator');
    const rotator = new AppsyncKeyRotator(scope, name, {
        api: scope.api,
        region: scope.region,
    });
    scope.resources
        .filter((f) => f.type === datatypes_1.AppsyncResourceType.LAMBDA_FUNCTION)
        .forEach((resource) => {
        const func = resource.construct;
        rotator.grantRead(func);
    });
    scope.rotator = rotator;
    scope.addResources([
        {
            type: datatypes_1.AppsyncResourceType.API_KEY_ROTATOR,
            awsType: datatypes_1.AwsResourceType.CUSTOM_RESOURCE,
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
exports.createRotator = createRotator;
//# sourceMappingURL=AppsyncKeyRotator.js.map