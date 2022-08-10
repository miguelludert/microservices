
export const getResourceByName = (cfnSchema : any, resourceName : string) => {
    const stackName = cfnSchema.stackMapping[resourceName];
    const stack = cfnSchema.stacks[stackName];
    if(stack) {
        const resource = stack.Resources[resourceName];
        return resource;
    }
     else { 
         return null;
     }
};