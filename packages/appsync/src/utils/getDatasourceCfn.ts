import { AwsResourceType } from "../datatypes";

export const getDatasourceCfn = (datasourceType, cfnSchema) => {
	// get dynamo resources by stack
	const result = Object.entries(cfnSchema.stacks).reduce(
		(acc, [stackName, stackCfn] : [string, any]) => {
			const resourcePairs = Object.entries(stackCfn.Resources);
			const datasourcePairs = resourcePairs.find(
				([resourceName, resourceCfn] : [string, any]) => {
					const isDatasource = resourceCfn.Type === AwsResourceType.DATASOURCE;
					const isDynamo = resourceCfn.Properties.Type === datasourceType;
					return isDatasource && isDynamo;
				},
			);
			if (datasourcePairs) {
				const [datasourceName, datasourceCfn] = datasourcePairs;
				acc.push({
					stackName,
					resourcePairs,
					datasourceName,
					datasourceCfn,
				});
			}
			return acc;
		},
		[],
	);
	return result;
};
