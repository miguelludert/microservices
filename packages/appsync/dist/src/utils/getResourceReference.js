"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceNameFromReference = void 0;
function getResourceNameFromReference(cfn, currentStackName, ref) {
    if (ref.Ref) {
        const parameterName = ref.Ref;
        const [refStackName, parameters] = cfn.rootStack['Resources'][currentStackName].Properties.Parameters[parameterName]["Fn::GetAtt"];
        const [sectionName, resourceName] = parameters[1].split('.');
        return resourceName;
    }
    else {
        return ref["Fn::GetAtt"][0];
    }
}
exports.getResourceNameFromReference = getResourceNameFromReference;
//# sourceMappingURL=getResourceReference.js.map