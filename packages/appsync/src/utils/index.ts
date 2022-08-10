export const findStack = (cfSchema, stackName) => {
  return cfSchema.stacks[stackName];
};

export const filterResourcePairsByType = (resourcePairs, type) => {
  return resourcePairs.filter(([, resource]) => resource.Type === type);
};

export const gatherStacks = (cfSchema) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.entries(cfSchema.stackMapping).reduce<any>(
    (acc, [name, stackName]: [string, any]) => {
      if (!acc[stackName]) {
        acc[stackName] = {};
      }
      acc[stackName][name] = cfSchema.stacks[name];
    },
    {}
  );
};

export const addSuffix = (suffix, str) =>
  str.endsWith(suffix) ? str : `${str}${suffix}`;

export function flatten(arr, d = 1) {
  return d > 0
    ? arr.reduce(
        (acc, val) =>
          acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val),
        []
      )
    : arr.slice();
}

export function tryCallback<TResult>(
  callback: () => TResult,
  errorMessage: string | Error
): TResult {
  let result: TResult;
  try {
    result = callback();
  } catch (err) {
    console.error(err);
    if (errorMessage as string) {
      throw new Error(errorMessage as string);
    } else {
      throw errorMessage;
    }
  }
  return result;
}

export function dedupeTail(name: string) {
  if (name) {
    const { length } = name;
    for (let i = 1; i < length / 2; i++) {
      const tail = name.slice(length - i);
      const body = name.slice(length - i * 2, length - i);
      const isSame = tail === body;
      if (isSame) {
        const result = name.slice(0, length - i);
        return result;
	  }
    }
	return name;
  } else {
    const message = 'dedupeTail: Cannot operate on an empty string.';
    console.error(message);
    throw new Error(message);
  }
}

export * from './getDatasourceCfn';
export * from './resource-utils';
