import { AuthTransformerConfig } from "@aws-amplify/graphql-auth-transformer";
import { AmplifyGeneratedCfn, AppsyncSchemaTransformerProps } from "../datatypes";
import { TransformerPluginBase } from "@aws-amplify/graphql-transformer-core";
export declare const tryCatch: (callback: any) => any;
export declare const getCloudFormation: (props: AppsyncSchemaTransformerProps) => AmplifyGeneratedCfn;
export declare const transformSchema: (schemaText: string, transformers: TransformerPluginBase[]) => AmplifyGeneratedCfn;
export declare function getAuthTransformerProps(props: AppsyncSchemaTransformerProps): AuthTransformerConfig | null;
export declare function writeOutputFiles(props: AppsyncSchemaTransformerProps, cfSchema: any): void;
