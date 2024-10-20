import BigNumber from 'bignumber.js';

/**
 * Helper function to map Solidity types from the ABI to EIP-712 types.
 * Handles basic types, arrays, and nested structs.
 * @param input - The ABI input parameter object.
 * @param types - The EIP-712 types object to be populated.
 * @param typeCache - A set to keep track of already processed struct names.
 * @returns The EIP-712 type as a string.
 */
function mapSolidityTypeToEIP712(input: any, types: Record<string, any>, typeCache: Set<string>): string {
    let solidityType = input.type;

    if (solidityType.startsWith('tuple')) {
        // Handle structs
        const isArray = solidityType.endsWith('[]');
        const baseType = solidityType.replace(/\[\]$/, ''); // Remove array brackets if present

        // Adjust input for base type (without array notation)
        const baseInput = { ...input, type: baseType };

        // Generate a unique name for the struct
        const typeName = generateUniqueStructName(baseInput, types, typeCache);

        return isArray ? `${typeName}[]` : typeName;
    } else if (solidityType.endsWith(']')) {
        // Handle arrays of basic types
        return solidityType;
    } else {
        // Basic types
        return solidityType;
    }
}

/**
 * Generates a unique name for a struct type and populates the EIP-712 types object.
 * @param input - The ABI input parameter object representing the struct.
 * @param types - The EIP-712 types object to be populated.
 * @param typeCache - A set to keep track of already processed struct names.
 * @returns A unique type name for the struct.
 */
function generateUniqueStructName(input: any, types: Record<string, any>, typeCache: Set<string>): string {
    // Extract or assign a base name for the struct
    let typeName = input.internalType || 'Struct';

    // Clean up the type name (remove 'struct', array indicators, and replace dots)
    typeName = typeName.replace(/^(struct )?(.+?)(\[\])?$/, '$2').replace(/\./g, '_');

    // Ensure the type name is unique by appending a counter if necessary
    let uniqueTypeName = typeName;
    let counter = 1;
    while (typeCache.has(uniqueTypeName)) {
        uniqueTypeName = `${typeName}_${counter}`;
        counter++;
    }

    typeCache.add(uniqueTypeName);

    // Map the struct's components to EIP-712 types
    types[uniqueTypeName] = input.components.map((component: any) => ({
        name: component.name,
        type: mapSolidityTypeToEIP712(component, types, typeCache),
    }));

    return uniqueTypeName;
}

/**
 * Formats the value of a transaction parameter for inclusion in the EIP-712 message object.
 * Handles BigNumbers, arrays, and nested structs.
 * @param value - The value of the parameter.
 * @param input - The ABI input parameter object.
 * @param types - The EIP-712 types object.
 * @returns The formatted value suitable for the EIP-712 message.
 */
function formatValueForMessage(value: any, input: any, types: Record<string, any>): any {
    if (BigNumber.isBigNumber(value)) {
        // Convert BigNumber to string
        return value.toString();
    } else if (Array.isArray(value)) {
        // Handle arrays by recursively formatting each item
        const baseInput = { ...input, type: input.type.replace(/\[\]$/, '') };
        return value.map((item: any) => formatValueForMessage(item, baseInput, types));
    } else if (input.type.startsWith('tuple')) {
        // Handle structs
        const structTypeName = getStructTypeName(input, types);
        const structDefinition = types[structTypeName];

        const formattedValue: Record<string, any> = {};
        structDefinition.forEach((field: any, idx: number) => {
            const fieldValue = value[field.name] !== undefined ? value[field.name] : value[idx];
            formattedValue[field.name] = formatValueForMessage(fieldValue, input.components[idx], types);
        });

        return formattedValue;
    } else {
        // Basic types (string, address, bool, etc.)
        return value;
    }
}

/**
 * Retrieves the struct type name from the EIP-712 types object based on the input components.
 * @param input - The ABI input parameter object representing the struct.
 * @param types - The EIP-712 types object.
 * @returns The struct type name as a string.
 */
function getStructTypeName(input: any, types: Record<string, any>): string {
    for (const [typeName, typeDef] of Object.entries(types)) {
        if (typeDef.length === input.components.length && typeDef.every((field: any, idx: number) => field.name === input.components[idx].name)) {
            return typeName;
        }
    }
    return 'UnknownStruct';
}

export { mapSolidityTypeToEIP712, generateUniqueStructName, formatValueForMessage, getStructTypeName };
