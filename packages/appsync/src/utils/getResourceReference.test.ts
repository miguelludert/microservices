import {getResourceNameFromReference} from './getResourceReference';
import { AmplifyGeneratedCfn } from '../datatypes';

describe("getResourceReference",() => { 
    it("should understand ref outside stack", () => {

        const refName = "referencetotransformerrootstackTodoTaskNestedStackTodoTaskNestedStackResourceB67A6D50OutputstransformerrootstackTodoTaskQuerygetTodoTaskpostAuth0FunctionQuerygetTodoTaskpostAuth0FunctionAppSyncFunction2AFC2ECDFunctionId";
        const outputName = "transformerrootstackTodoTaskQuerygetTodoTaskpostAuth0FunctionQuerygetTodoTaskpostAuth0FunctionAppSyncFunction2AFC2ECDFunctionId";
        const resourceName = "QuerygetTodoTaskpostAuth0FunctionQuerygetTodoTaskpostAuth0FunctionAppSyncFunctionD5099704"
        const ref = {
            "Ref": refName
        };
        const currentStackName = "SharedWith";
        const cfn = {
            stacks: { 
                SharedWith :{ 
                    Parameters : {
                        [refName] : {
                            "Fn::GetAtt": [
                                "TodoTask",
                                `Outputs.${outputName}`
                            ]
                        }
                    }
                },
                TodoTask : {
                    Outputs : {
                        [outputName] : {
                            Value : {
                                "Fn::GetAtt": [
                                    resourceName,
                                    "FunctionId"
                                ]
                            } 
                        }  
                    },
                    Resources : { 
                        [resourceName] : {
                            "Type": "AWS::AppSync::Resolver"
                        }
                    }
                }
            }
        } as AmplifyGeneratedCfn;
        const result = getResourceNameFromReference(cfn, currentStackName, ref);
    }); 
    it("should understand Fn:GetAtt", () => {

        const resourceName = "QuerygetTodoTaskpostAuth0FunctionQuerygetTodoTaskpostAuth0FunctionAppSyncFunctionD5099704"
        const ref = {
            "Fn::GetAtt": [
                resourceName,
                "FunctionId"
            ]
        } ;
        const currentStackName = "TodoTask";
        const cfn = {
            stacks : { 
                TodoTask : {
                    Resources : { 
                        [resourceName] : {
                            "Type": "AWS::AppSync::Resolver"
                        }
                    }
                }
            }
        }  as AmplifyGeneratedCfn;
        const result = getResourceNameFromReference(cfn, currentStackName, ref);
    }); 
});