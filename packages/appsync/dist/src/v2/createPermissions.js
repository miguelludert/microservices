"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPermissions = void 0;
const datatypes_1 = require("../datatypes");
function createPermissions(scope, props, api, cfn, resources) {
    // give all lambdas access to all tables
    // TODO : consider more refined security here
    const tables = resources
        .filter((f) => f.type == datatypes_1.AppsyncResourceType.DYNAMO_TABLE)
        .map((m) => m.construct);
    const lambdas = resources
        .filter((f) => f.type == datatypes_1.AppsyncResourceType.LAMBDA_FUNCTION)
        .map((m) => m.construct);
    lambdas.forEach((lambda) => tables.forEach((table) => {
        table.grantReadWriteData(lambda);
    }));
    return [];
}
exports.createPermissions = createPermissions;
//# sourceMappingURL=createPermissions.js.map