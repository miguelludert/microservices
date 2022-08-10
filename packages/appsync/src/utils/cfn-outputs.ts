import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export const cfnOutputs = (scope : Construct, obj : Record<string,string>, namingConvention? : (string) => string) : CfnOutput[]=> {
    return Object.entries(obj).map(entry => { 
        const [name,value] = entry;
        const exportName = namingConvention ? namingConvention(name) : name;
        return new CfnOutput(scope, exportName,{
            exportName,
            value 
        });
    });
};