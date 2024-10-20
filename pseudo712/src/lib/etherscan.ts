import axios from 'axios';

/**
 * Fetches the ABI for a contract from Etherscan.
 * @param contractAddress - The address of the contract.
 * @returns The ABI as an array.
 */
async function getABI(contractAddress: string): Promise<any[]> {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) {
        throw new Error('Etherscan API key is not set in environment variables.');
    }

    const url = `https://api.etherscan.io/api`;
    const params = {
        module: 'contract',
        action: 'getabi',
        address: contractAddress,
        apikey: apiKey,
    };

    try {
        const response = await axios.get(url, { params });
        if (response.data.status !== '1') {
            throw new Error(`Failed to fetch ABI from Etherscan: ${response.data.result}`);
        }

        const abi = JSON.parse(response.data.result);
        return abi;
    } catch (error: any) {
        throw new Error(`Error fetching ABI from Etherscan: ${error.message}`);
    }
}

export default { getABI };
