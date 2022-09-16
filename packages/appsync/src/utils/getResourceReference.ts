import { AmplifyGeneratedCfn, ResourceByStackAndName } from "../datatypes";

export function getResourceNameFromReference(cfn : AmplifyGeneratedCfn, currentStackName : string, ref : any) : string{ 
  if(ref.Ref) {
    const parameterName = ref.Ref as string;
    const [refStackName, parameters] = cfn.rootStack['Resources'][currentStackName].Properties.Parameters[parameterName]["Fn::GetAtt"];
    const [sectionName, resourceName] = parameters[1].split('.');
    return resourceName;
  } else {
    return ref["Fn::GetAtt"][0];
  }
}