"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceByName = void 0;
const getResourceByName = (cfnSchema, resourceName) => {
    const stackName = cfnSchema.stackMapping[resourceName];
    const stack = cfnSchema.stacks[stackName];
    if (stack) {
        const resource = stack.Resources[resourceName];
        return resource;
    }
    else {
        return null;
    }
};
exports.getResourceByName = getResourceByName;
//# sourceMappingURL=resource-utils.js.map