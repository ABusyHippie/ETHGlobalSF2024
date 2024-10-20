// my-app/src/App.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import './App.css'; // Import the CSS file for styles
import zenditLogo from './zendit.png'; // Import the logo
import DropDownMenu from './DropDownMenu'; // Import the DropdownMenu component
import AbiUploader from './abi'; // Import the AbiUploader component

interface VerifyTransactionResponse {
  clearSignMessage: string;
}

const MyDApp: React.FC = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<ethers.TransactionRequest | null>(null);
  const [clearSignMessage, setClearSignMessage] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Initialize ethers.js and connect wallet
  const initializeEthers = async () => {
    if ((window as any).ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider((window as any).ethereum);
        await web3Provider.send('eth_requestAccounts', []); // Request account connection
        setProvider(web3Provider);
        const connectedSigner = await web3Provider.getSigner(); // Get signer
        setSigner(connectedSigner);
        setWalletAddress(await connectedSigner.getAddress());
      } catch (error) {
        console.error("Error initializing ethers:", error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Intercept transaction data and send for verification before signing
  const interceptTransactionAndVerify = async (transaction: ethers.TransactionRequest) => {
    try {
      const { to, data, value, gasLimit } = transaction;

      if (!to || !data) {
        throw new Error('Transaction data is incomplete.');
      }

      // Prepare payload for the verification API
      const payload = {
        chainId: await provider?.getNetwork().then(network => network.chainId),
        from: await signer?.getAddress(),
        to,
        data,
        value: value ? value.toString() : '0',
        gasLimit: gasLimit ? gasLimit.toString() : '500000',
        blockNumber: await provider?.getBlockNumber(),
      };

      // Send POST request to backend verification API
      const backendResponse = await axios.post<VerifyTransactionResponse>(
        '/api/verifyTransaction',
        payload
      );

      // Extract the clear sign message
      const { clearSignMessage } = backendResponse.data;
      setClearSignMessage(clearSignMessage);
    } catch (error) {
      console.error('Error verifying transaction:', error);
      alert(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Hook into any transaction the user is about to sign
  const addTransactionHook = () => {
    if (!signer) {
      alert('Please connect your wallet first.');
      return;
    }

    provider?.on('pending', async (txHash: string) => {
      try {
        const tx = await provider.getTransaction(txHash);
        if (tx && tx.from.toLowerCase() === walletAddress?.toLowerCase()) {
          // Transaction involves the connected wallet, show the "Verify" button
          console.log('Detected pending transaction:', tx);
          setPendingTransaction(tx);
        }
      } catch (error) {
        console.error('Error fetching transaction details:', error);
      }
    });
  };

  // Sign and send the transaction
  const signTransaction = async () => {
    if (!signer || !pendingTransaction) {
      alert('No transaction to sign.');
      return;
    }

    try {
      // Verify the transaction before signing
      await interceptTransactionAndVerify(pendingTransaction);

      // Proceed to sign and send the transaction
      const txResponse = await signer.sendTransaction(pendingTransaction);
      console.log('Transaction sent:', txResponse);
    } catch (error) {
      console.error("Error signing transaction:", error);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const highlight = document.querySelector('.highlight');
      if (highlight) {
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
        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
      </button>
      <button className="button" onClick={addTransactionHook}>Monitor for Pending Transactions</button>
      {pendingTransaction && (
        <div className="transaction-container">
          <button className="button" onClick={signTransaction}>Verify and Sign Transaction</button>
          {clearSignMessage && <div><p>Clear Sign Message:</p><pre>{clearSignMessage}</pre></div>}
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
      <DropDownMenu /> {/* Add the dropdown menu here */}
    </div>
  );
};

export default App;