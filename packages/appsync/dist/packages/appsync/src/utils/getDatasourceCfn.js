"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatasourceCfn = void 0;
const datatypes_1 = require("../datatypes");
const getDatasourceCfn = (datasourceType, cfnSchema) => {
    // get dynamo resources by stack
    const result = Object.entries(cfnSchema.stacks).reduce((acc, [stackName, stackCfn]) => {
        const resourcePairs = Object.entries(stackCfn.Resources);
        const datasourcePairs = resourcePairs.find(([resourceName, resourceCfn]) => {
            const isDatasource = resourceCfn.Type === datatypes_1.AwsResourceType.DATASOURCE;
            const isDynamo = resourceCfn.Properties.Type === datasourceType;
            return isDatasource && isDynamo;
        });
        if (datasourcePairs) {
            const [datasourceName, datasourceCfn] = datasourcePairs;
            acc.push({
                stackName,
                resourcePairs,
                datasourceName,
                datasourceCfn,
            });
        }
        return acc;
    }, []);
    return result;
};
exports.getDatasourceCfn = getDatasourceCfn;
//# sourceMappingURL=getDatasourceCfn.js.map