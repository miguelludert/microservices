"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cfnOutputs = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cfnOutputs = (scope, obj, namingConvention) => {
    return Object.entries(obj).map(entry => {
        const [name, value] = entry;
        const exportName = namingConvention ? namingConvention(name) : name;
        return new aws_cdk_lib_1.CfnOutput(scope, exportName, {
            exportName,
            value
        });
    });
};
exports.cfnOutputs = cfnOutputs;
//# sourceMappingURL=cfn-outputs.js.map