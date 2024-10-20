import express from 'express';
import { Request, Response } from 'express';
import { ethers } from 'ethers';
import etherscan from '../lib/etherscan';
import { mapSolidityTypeToEIP712, generateUniqueStructName, formatValueForMessage, getStructTypeName } from '../lib/eip712';
const router = express.Router();

// Add this function before your route handler
const bigIntReplacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

/**
 * API endpoint to verify a transaction and generate a clear sign message.
 * Expects a POST request with the transaction details and optional ABI.
 */
router.post('/api/verifyTransaction', async (req: Request, res: Response) => {
    const { contractAddress, transactionData, from, to, value } = req.body;
    let { abi } = req.body; // abi is optional

    try {
        if (!contractAddress || !transactionData) {
            res.status(400).json({ error: 'Missing required fields.' });
            return;
        }

        // If abi is not provided, fetch it from Etherscan
        if (!abi) {
            try {
                abi = await etherscan.getABI(contractAddress);
            } catch (error: any) {
                console.error('Error fetching ABI:', error.message);

                res.status(500).json({ error: 'Failed to fetch ABI from Etherscan.' });
                return;
            }
        }

        // Create an Interface instance with the provided or fetched ABI
        const iface = new ethers.Interface(abi);

        // Parse the transaction data to get the function call and arguments
        const decoded = iface.parseTransaction({ data: transactionData })!;

        const primaryType = decoded.name;
        const types: Record<string, Array<{ name: string; type: string }>> = {};
        const typeCache: Set<string> = new Set();

        // Initialize the primary type in the EIP-712 types object
        types[primaryType] = [];

        // Map function inputs to EIP-712 types
        decoded.fragment.inputs.forEach((input) => {
            const eip712Type = mapSolidityTypeToEIP712(input, types, typeCache);
            types[primaryType].push({
                name: input.name,
                type: eip712Type,
            });
        });

        // Build the EIP-712 message object with actual parameter values
        const message: Record<string, any> = {};
        decoded.fragment.inputs.forEach((input, index) => {
            const value = formatValueForMessage(decoded.args[index], input, types);
            message[input.name] = value;
        });

        // Define the EIP-712 domain separator
        const domain = {
            name: 'YourDAppName', // Replace with your DApp's name
            version: '1', // DApp version
            chainId: 1, // Update with the correct chain ID if necessary
            verifyingContract: contractAddress,
        };

        // Assemble the complete EIP-712 typed data
        const typedData = {
            types: {
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                    { name: 'chainId', type: 'uint256' },
                    { name: 'verifyingContract', type: 'address' },
                ],
                ...types,
            },
            domain,
            primaryType,
            message,
        };

        // Generate the clear sign message as a JSON string
        const clearSignMessage = JSON.stringify(typedData, bigIntReplacer);

        // Send the clear sign message back to the frontend
        res.json({ clearSignMessage });
    } catch (error) {
        console.error('Error processing transaction:', error);
        res.status(500).json({ error: 'Failed to process transaction.' });
    }
});

export default router;
