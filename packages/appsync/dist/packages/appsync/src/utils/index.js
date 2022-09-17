"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dedupeTail = exports.tryCallback = exports.flatten = exports.addSuffix = exports.gatherStacks = exports.filterResourcePairsByType = exports.findStack = void 0;
const tslib_1 = require("tslib");
const findStack = (cfSchema, stackName) => {
    return cfSchema.stacks[stackName];
};
exports.findStack = findStack;
const filterResourcePairsByType = (resourcePairs, type) => {
    return resourcePairs.filter(([, resource]) => resource.Type === type);
};
exports.filterResourcePairsByType = filterResourcePairsByType;
const gatherStacks = (cfSchema) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.entries(cfSchema.stackMapping).reduce((acc, [name, stackName]) => {
        if (!acc[stackName]) {
            acc[stackName] = {};
        }
        acc[stackName][name] = cfSchema.stacks[name];
    }, {});
};
exports.gatherStacks = gatherStacks;
const addSuffix = (suffix, str) => str.endsWith(suffix) ? str : `${str}${suffix}`;
exports.addSuffix = addSuffix;
function flatten(arr, d = 1) {
    return d > 0
        ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val), [])
        : arr.slice();
}
exports.flatten = flatten;
function tryCallback(callback, errorMessage) {
    let result;
    try {
        result = callback();
    }
    catch (err) {
        console.error(err);
        if (errorMessage) {
            throw new Error(errorMessage);
        }
        else {
            throw errorMessage;
        }
    }
    return result;
}
exports.tryCallback = tryCallback;
function dedupeTail(name) {
    if (name) {
        const { length } = name;
        for (let i = 1; i < length / 2; i++) {
            const tail = name.slice(length - i);
            const body = name.slice(length - i * 2, length - i);
            const isSame = tail === body;
            if (isSame) {
                const result = name.slice(0, length - i);
                return result;
            }
        }
        return name;
    }
    else {
        const message = 'dedupeTail: Cannot operate on an empty string.';
        console.error(message);
        throw new Error(message);
    }
}
exports.dedupeTail = dedupeTail;
tslib_1.__exportStar(require("./getDatasourceCfn"), exports);
tslib_1.__exportStar(require("./resource-utils"), exports);
//# sourceMappingURL=index.js.map