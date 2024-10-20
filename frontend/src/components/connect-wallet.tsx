'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletConnectButton: React.FC = () => {
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    useEffect(() => {
        // Check if MetaMask is installed
        if ((window as any).ethereum !== 'undefined') {
            // Create a new provider
            const ethProvider = new ethers.providers.Web3Provider((window as any).ethereum);
            setProvider(ethProvider);
        }
    }, []);

    const connectWallet = async () => {
        if (!provider) {
            alert('Please install MetaMask!');
            return;
        }

        try {
            // Request account access
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

            // Get the signer
            const ethSigner = provider.getSigner();
            setSigner(ethSigner);

            // Get the wallet address
            const address = await ethSigner.getAddress();
            setWalletAddress(address);
        } catch (error) {
            console.error('Error connecting wallet:', error);
        }
    };

    return <button onClick={connectWallet}>{walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}</button>;
};

export default WalletConnectButton;
