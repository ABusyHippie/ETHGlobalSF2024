// my-app/src/App.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // Ensure this import is correct
import axios from 'axios';
import './App.css'; // Import the CSS file for styles
import zenditLogo from './zendit.png'; // Import the logo
import DropdownMenu from './DropDownMenu'; // Import the DropdownMenu component
import AbiUploader from './abi'; // Import the AbiUploader component

interface VerifyTransactionResponse {
  clearSignMessage: string;
}

const MyDApp: React.FC = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null); // Updated type
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<ethers.TransactionRequest | null>(null);
  const [clearSignMessage, setClearSignMessage] = useState<string | null>(null); // New state for clear sign message
  const [walletAddress, setWalletAddress] = useState<string | null>(null); // New state for wallet address

  const initializeEthers = async () => {
    if ((window as any).ethereum) {
      const web3Provider = new ethers.BrowserProvider((window as any).ethereum); // Updated to use BrowserProvider
      await web3Provider.send('eth_requestAccounts', []);
      setProvider(web3Provider);
      const signer = await web3Provider.getSigner(); // Store signer in a variable
      setSigner(signer);
      setWalletAddress(await signer.getAddress()); // Call getAddress on the signer variable
    } else {
      alert('Please install MetaMask!');
    }
  };

  const verifyTransaction = async (transaction: ethers.TransactionRequest) => {
    try {
      const { to, data, value } = transaction;

      if (!to || !data) {
        throw new Error('Transaction data is incomplete.');
      }

      // Fetch the ABI from Etherscan
      const etherscanApiKey = 'YOUR_ETHERSCAN_API_KEY'; // Replace with your API key
      const abiResponse = await axios.get(
        'https://api.etherscan.io/api',
        {
          params: {
            module: 'contract',
            action: 'getabi',
            address: to,
            apikey: etherscanApiKey,
          },
        }
      );

      if (abiResponse.data.status !== '1') {
        throw new Error('Failed to fetch ABI from Etherscan.');
      }

      const abi = JSON.parse(abiResponse.data.result);

      // Prepare payload for backend API
      const payload = {
        contractAddress: to,
        transactionData: data,
        from: await signer?.getAddress(),
        to,
        value: value ? value.toString() : '0',
        abi,
      };

      // Send POST request to backend API
      const backendResponse = await axios.post<VerifyTransactionResponse>(
        '/api/verifyTransaction',
        payload
      );

      // Extract the clear sign message
      const { clearSignMessage } = backendResponse.data;
      setClearSignMessage(clearSignMessage); // Store the clear sign message in state
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Verification failed:', error);
        alert(`Verification failed: ${error.message}`);
      } else {
        console.error('Verification failed:', error);
        alert('Verification failed: Unknown error');
      }
    }
  };

  const initiateTransaction = async () => {
    if (!signer) {
      alert('Please connect your wallet.');
      return;
    }

    // Define the contract address and ABI (if known)
    const contractAddress = '0xContractAddress'; // Replace with actual address
    const contractAbi: any[] = []; // Ensure ABI is defined as an empty array if not available

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);

    // Prepare the transaction
    // const txData = await contract.populateTransaction.actualFunctionName(/* parameters */); // Replace actualFunctionName with the real function name
    const txData = { // Mock data for transaction
      to: contractAddress,
      value: ethers.parseEther("0.01"), // Updated to access parseEther directly from ethers
      data: "0x", // Example data
    };

    // Save the transaction data to state
    setPendingTransaction(txData);
  };

  const signTransaction = async () => {
    if (!signer || !pendingTransaction) {
      alert('No transaction to sign.');
      return;
    }

    const txResponse = await signer.sendTransaction(pendingTransaction);
    console.log('Transaction sent:', txResponse);
  };

  // Mouse move effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const highlight = document.querySelector('.highlight');
      if (highlight) {
        // Adjust the position to center the highlight over the cursor
        highlight.setAttribute('style', `top: ${e.clientY}px; left: ${e.clientX}px; transform: translate(-50%, -50%);`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="dapp-container">
      <button className="button" onClick={initializeEthers}>
        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'} {/* Display truncated address */}
      </button>
      <button className="button" onClick={initiateTransaction}>Initiate Transaction</button>
      {pendingTransaction && (
        <div className="transaction-container">
          <button className="button" onClick={() => verifyTransaction(pendingTransaction)}>Verify Transaction</button>
          {clearSignMessage && <div><p>Clear Sign Message:</p><pre>{clearSignMessage}</pre></div>}
          <button className="button" onClick={signTransaction}>Sign and Send Transaction</button>
        </div>
      )}
      <div className="highlight"></div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="App">
      <img src={zenditLogo} alt="Send It Logo" className="logo" />
      <h1 className="title">Zend It!</h1>
      <MyDApp />
      <AbiUploader /> {/* Add the ABI uploader here */}
      <DropdownMenu /> {/* Add the dropdown menu here */}
    </div>
  );
};

export default App;
