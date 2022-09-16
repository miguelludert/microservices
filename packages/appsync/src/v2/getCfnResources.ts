import { AmplifyGeneratedCfn, ResourceByStackAndName } from "../datatypes";

export const getCfnResourcesByStackAndName = (cfn: AmplifyGeneratedCfn) : ResourceByStackAndName[] => {
    const rootStackResources = Object.entries(cfn.rootStack.Resources).map(([name, resourceCfn]) => { 
        return {
            stackName : "rootStack",
            cfn : resourceCfn,
            name
        }
    });
    const stackResources = Object
        .entries(cfn.stacks)
        .reduce<ResourceByStackAndName[]>((acc, stackEntry) => {
            const [stackName, stackCfn ] = stackEntry;
            const results = Object.entries(stackCfn.Resources).map(([resourceName, resourceCfn]) => ({
                stackName,
                cfn : resourceCfn,
                name : resourceName
            } as ResourceByStackAndName));
            return [
                ...acc,
                ...results
            ]
        }, [] as ResourceByStackAndName[]);
    return [
        ...rootStackResources,
        ...stackResources
    ];
  };