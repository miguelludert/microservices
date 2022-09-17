import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare const cfnOutputs: (scope: Construct, obj: Record<string, string>, namingConvention?: (string: any) => string) => CfnOutput[];
