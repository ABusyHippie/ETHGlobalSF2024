import { ethers } from 'ethers';
import { mapSolidityTypeToEIP712, generateUniqueStructName, formatValueForMessage, getStructTypeName } from '../src/lib/eip712';
import BigNumber from 'bignumber.js';

describe('mapSolidityTypeToEIP712', () => {
    let types: Record<string, any>;
    let typeCache: Set<string>;

    beforeEach(() => {
        types = {};
        typeCache = new Set();
    });

    it('should map basic types correctly', () => {
        const input = { type: 'uint256' };
        const result = mapSolidityTypeToEIP712(input, types, typeCache);
        expect(result).toBe('uint256');
    });

    it('should handle arrays of basic types', () => {
        const input = { type: 'uint256[]' };
        const result = mapSolidityTypeToEIP712(input, types, typeCache);
        expect(result).toBe('uint256[]');
    });

    it('should handle structs', () => {
        const input = {
            type: 'tuple',
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'name', type: 'string' },
            ],
            internalType: 'struct MyStruct',
        };
        const result = mapSolidityTypeToEIP712(input, types, typeCache);
        expect(result).toBe('MyStruct');
        expect(types['MyStruct']).toEqual([
            { name: 'id', type: 'uint256' },
            { name: 'name', type: 'string' },
        ]);
    });

    it('should handle arrays of structs', () => {
        const input = {
            type: 'tuple[]',
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'name', type: 'string' },
            ],
            internalType: 'struct MyStruct[]',
        };
        const result = mapSolidityTypeToEIP712(input, types, typeCache);
        expect(result).toBe('MyStruct[]');
        expect(types['MyStruct']).toEqual([
            { name: 'id', type: 'uint256' },
            { name: 'name', type: 'string' },
        ]);
    });
});

describe('generateUniqueStructName', () => {
    let types: Record<string, any>;
    let typeCache: Set<string>;

    beforeEach(() => {
        types = {};
        typeCache = new Set();
    });

    it('should generate unique struct names', () => {
        const input = {
            internalType: 'struct MyStruct',
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'value', type: 'string' },
            ],
        };
        const firstTypeName = generateUniqueStructName(input, types, typeCache);
        expect(firstTypeName).toBe('MyStruct');
        const secondTypeName = generateUniqueStructName(input, types, typeCache);
        expect(secondTypeName).toBe('MyStruct_1');
    });
});

describe('formatValueForMessage', () => {
    let types: Record<string, any>;
    let typeCache: Set<string>;

    beforeEach(() => {
        types = {};
        typeCache = new Set();
    });

    it('should format BigNumber values to strings', () => {
        const value = BigNumber('123456789');
        const input = { type: 'uint256' };
        const result = formatValueForMessage(value, input, types);
        expect(result).toBe('123456789');
    });

    it('should handle arrays of basic types', () => {
        const value = [1, 2, 3];
        const input = { type: 'uint256[]' };
        const result = formatValueForMessage(value, input, types);
        expect(result).toEqual([1, 2, 3]);
    });

    it('should handle structs', () => {
        const value = { id: 1, name: 'Test' };
        const input = {
            type: 'tuple',
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'name', type: 'string' },
            ],
            internalType: 'struct MyStruct',
        };
        // Prepare types
        mapSolidityTypeToEIP712(input, types, typeCache);
        const result = formatValueForMessage(value, input, types);
        expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should handle arrays of structs', () => {
        const value = [
            { id: 1, name: 'First' },
            { id: 2, name: 'Second' },
        ];
        const input = {
            type: 'tuple[]',
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'name', type: 'string' },
            ],
            internalType: 'struct MyStruct[]',
        };
        // Prepare types
        mapSolidityTypeToEIP712(input, types, typeCache);
        const result = formatValueForMessage(value, input, types);
        expect(result).toEqual([
            { id: 1, name: 'First' },
            { id: 2, name: 'Second' },
        ]);
    });
});

describe('getStructTypeName', () => {
    let types: Record<string, any>;

    beforeEach(() => {
        types = {};
    });

    it('should return the correct struct type name', () => {
        const input = {
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'value', type: 'string' },
            ],
        };
        types['MyStruct'] = [
            { name: 'id', type: 'uint256' },
            { name: 'value', type: 'string' },
        ];
        const typeName = getStructTypeName(input, types);
        expect(typeName).toBe('MyStruct');
    });

    it('should return "UnknownStruct" if type not found', () => {
        const input = {
            components: [
                { name: 'foo', type: 'uint256' },
                { name: 'bar', type: 'string' },
            ],
        };
        const typeName = getStructTypeName(input, types);
        expect(typeName).toBe('UnknownStruct');
    });
});

// Repeat similar adjustments for other describe blocks
