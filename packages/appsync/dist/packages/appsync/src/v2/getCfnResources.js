"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCfnResourcesByStackAndName = void 0;
const getCfnResourcesByStackAndName = (cfn) => {
    const rootStackResources = Object.entries(cfn.rootStack.Resources).map(([name, resourceCfn]) => {
        return {
            stackName: "rootStack",
            cfn: resourceCfn,
            name
        };
    });
    const stackResources = Object
        .entries(cfn.stacks)
        .reduce((acc, stackEntry) => {
        const [stackName, stackCfn] = stackEntry;
        const results = Object.entries(stackCfn.Resources).map(([resourceName, resourceCfn]) => ({
            stackName,
            cfn: resourceCfn,
            name: resourceName
        }));
        return [
            ...acc,
            ...results
        ];
    }, []);
    return [
        ...rootStackResources,
        ...stackResources
    ];
};
exports.getCfnResourcesByStackAndName = getCfnResourcesByStackAndName;
//# sourceMappingURL=getCfnResources.js.map