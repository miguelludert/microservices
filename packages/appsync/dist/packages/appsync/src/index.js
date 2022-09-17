"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppsyncSchemaTransformer = exports.buildFunctionCode = void 0;
const tslib_1 = require("tslib");
var lambda_1 = require("./v2/lambda");
Object.defineProperty(exports, "buildFunctionCode", { enumerable: true, get: function () { return lambda_1.buildFunctionCode; } });
var AppsyncSchemaTransformer_1 = require("./v2/AppsyncSchemaTransformer");
Object.defineProperty(exports, "AppsyncSchemaTransformer", { enumerable: true, get: function () { return AppsyncSchemaTransformer_1.AppsyncSchemaTransformer; } });
//export { AppsyncKeyRotator, AppsyncKeyRotatorProps } from './v2/AppsyncKeyRotator.ts.old';
tslib_1.__exportStar(require("./datatypes/datatypes"), exports);
//# sourceMappingURL=index.js.map