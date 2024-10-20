'use client';
import React, { useState } from 'react';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import Eth from '@ledgerhq/hw-app-eth';
import { ethers } from 'ethers';

// Define types for our EIP-712 message
type EIP712Domain = {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
};

type SendTokens = {
    token: string;
    recipient: string;
    amount: string;
};

type EIP712Message = {
    domain: EIP712Domain;
    types: {
        EIP712Domain: { name: string; type: string }[];
        sendTokens: { name: string; type: string }[];
    };
    primaryType: 'sendTokens';
    message: SendTokens;
};

const LedgerClearSignComponent: React.FC = () => {
    const [signature, setSignature] = useState<string>('');
    const [status, setStatus] = useState<string>('');

    const eip721Message: EIP712Message = {
        domain: {
            chainId: 11155111, // Sepolia testnet
            name: "SafeTokenTransfer",
            verifyingContract: "0xA22A9F143E2919722A238A919a05E725a4917556",
            version: "1"
        },
        types: {
            EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" }
            ],
            sendTokens: [
                { name: "token", type: "address" },
                { name: "recipient", type: "address" },
                { name: "amount", type: "uint256" }
            ]
        },
        primaryType: "sendTokens",
        message: {
            token: "0x28897bF27a8b89A988308d3A322975452c897805",
            recipient: "0xccE1CEa192592AB8E29bbF10a31471edD22817A3",
            amount: "10"
        }
    };

    const handleClearSign = async () => {
        setStatus('Connecting to Ledger...');
        try {
            const transport = await TransportWebUSB.create();
            const eth = new Eth(transport);

            setStatus('Ledger connected. Please review and sign the message on your device.');

            const derivationPath = "44'/60'/0'/0/0"; // Ensure this matches your Ledger account

            // Attempt to use signEIP712Message for clear signing
            try {
                const result = await eth.signEIP712Message(
                    derivationPath,
                    eip721Message
                );

                // Combine the signature components
                const signature = ethers.utils.joinSignature({
                    r: '0x' + result.r,
                    s: '0x' + result.s,
                    v: result.v
                });

                setSignature(signature);
                setStatus('Message signed successfully with clear signing!');
            } catch (err) {
                // Fallback to signEIP712HashedMessage if clear signing is not supported
                console.warn("Clear signing not supported, falling back to hashed signing:", err);
                setStatus('Clear signing not supported. Falling back to hashed signing...');

                const domainSeparator = ethers.utils._TypedDataEncoder.hashDomain(eip721Message.domain);
                const hashStructMessage = ethers.utils._TypedDataEncoder.hash(
                    eip721Message.domain,
                    { sendTokens: eip721Message.types.sendTokens },
                    eip721Message.message
                );

                const result = await eth.signEIP712HashedMessage(
                    derivationPath,
                    domainSeparator.slice(2),
                    hashStructMessage.slice(2)
                );

                const signature = ethers.utils.joinSignature({
                    r: '0x' + result.r,
                    s: '0x' + result.s,
                    v: result.v
                });

                setSignature(signature);
                setStatus('Message signed successfully with hashed signing.');
            }
        } catch (error) {
            console.error('Error:', error);
            if (error instanceof Error) {
                setStatus('Error: ' + error.message);
            } else {
                setStatus('An unknown error occurred.');
            }
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Ledger Clear Sign (EIP-712)</h1>
            <button
                onClick={handleClearSign}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Sign with Ledger
            </button>
            <p className="mt-2">{status}</p>
            {signature && (
                <div className="mt-4">
                    <h2 className="text-xl font-semibold">Signature:</h2>
                    <p className="break-all">{signature}</p>
                </div>
            )}
        </div>
    );
};

export default LedgerClearSignComponent;