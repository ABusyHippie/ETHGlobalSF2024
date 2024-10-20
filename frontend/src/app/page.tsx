'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HyperText from '@/components/ui/hyper-text';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

import { ZENDIT_TKN_SEPOLIA } from '@/lib/addresses';
import tokenABI from '@/lib/abi/zendit_token.json';

export default function TokenTransferPage() {
    const [activeTab, setActiveTab] = useState('safe');
    const [tokenAddress, setTokenAddress] = useState(ZENDIT_TKN_SEPOLIA);
    const [recipientAddress, setRecipientAddress] = useState('');
    const [tokenAmount, setTokenAmount] = useState(0);
    const [abi, setAbi] = useState<string | null>(null);
    const { toast } = useToast();

    const handleMint = async () => {
        try {
            const result = await mintToken();
            if (result.success) {
                toast({
                    title: 'Minting Successful!',
                    description: `Transaction hash: ${result.transactionHash.slice(0, 10)}...`,
                    duration: 5000,
                });
            } else {
                toast({
                    title: 'Minting Failed',
                    description: result.error,
                    variant: 'destructive',
                    duration: 5000,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
                duration: 5000,
            });
        }
    };

    async function mintToken() {
        // Check if MetaMask is installed
        if (typeof (window as any).ethereum === 'undefined') {
            throw new Error('Please install MetaMask to use this function');
        }

        try {
            // Request account access
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

            // Create a Web3Provider and get the signer
            const provider = new ethers.providers.Web3Provider((window as any).ethereum);
            const signer = provider.getSigner();

            // Create a contract instance
            const tokenContract = new ethers.Contract(ZENDIT_TKN_SEPOLIA, tokenABI, signer);

            // Call the mint function
            const tx = await tokenContract.mint();

            // Wait for the transaction to be mined
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
            };
        } catch (error) {
            console.error('Error minting token:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred',
            };
        }
    }

    return (
        <main className="container mx-auto mt-8 px-4 max-w-4xl ">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="safe" className="py-3">
                        Safe Token Transfer
                    </TabsTrigger>
                    <TabsTrigger value="malicious" className="py-3">
                        Malicious Token Transfer
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="safe" className="mt-6">
                    <Card className="w-full ">
                        <CardHeader>
                            <CardTitle>
                                <HyperText className="text-2xl font-bold text-black dark:text-white" text="Safe Token Transfer" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contract-address">Contract Address</Label>
                                    <Input id="contract-address" placeholder="Enter contract address" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recipient-address">Recipient Address</Label>
                                    <Input
                                        id="recipient-address"
                                        placeholder="Enter recipient address"
                                        value={recipientAddress}
                                        onChange={(e) => setRecipientAddress(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 z-10">
                                    <Label htmlFor="token-amount">Amount of Tokens</Label>
                                    <Input
                                        id="token-amount"
                                        type="number"
                                        placeholder="Enter amount of tokens"
                                        value={tokenAmount}
                                        onChange={(e) => setTokenAmount(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="abi-upload">Upload ABI</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input id="abi-upload" type="file" className="hidden" onChange={(e) => setAbi(e.target.files?.[0]?.name || null)} />
                                        <Button variant="outline" onClick={() => document.getElementById('abi-upload')?.click()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload ABI
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="outline">Approve</Button>
                                    <Button>Submit</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="malicious" className="mt-6">
                    <Card className="w-full ">
                        <CardHeader>
                            <CardTitle>
                                <HyperText className="text-2xl font-bold text-black dark:text-white" text="Malicious Token Transfer" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contract-address-malicious">Contract Address</Label>
                                    <Input
                                        id="contract-address-malicious"
                                        placeholder="Enter contract address"
                                        value={tokenAddress}
                                        onChange={(e) => setTokenAddress(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recipient-address-malicious">Recipient Address</Label>
                                    <Input
                                        id="recipient-address-malicious"
                                        placeholder="Enter recipient address"
                                        value={recipientAddress}
                                        onChange={(e) => setRecipientAddress(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="token-amount-malicious">Amount of Tokens</Label>
                                    <Input
                                        id="token-amount-malicious"
                                        type="number"
                                        placeholder="Enter amount of tokens"
                                        value={tokenAmount}
                                        onChange={(e) => setTokenAmount(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="abi-upload-malicious">Upload ABI</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input id="abi-upload-malicious" type="file" className="hidden" onChange={(e) => setAbi(e.target.files?.[0]?.name || null)} />
                                        <Button variant="outline" onClick={() => document.getElementById('abi-upload-malicious')?.click()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload ABI
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="outline">Approve</Button>
                                    <Button>Submit</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card className="w-full mt-8">
                <CardHeader>
                    <CardTitle>
                        <HyperText className="text-2xl font-bold text-black dark:text-white" text="Demo Token" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p>
                                <strong>Contract Address:</strong> 0xfCF82...d66c1
                            </p>
                            <p>
                                <strong>Token Symbol:</strong> ZND
                            </p>
                            <p>
                                <strong>Decimals:</strong> 18
                            </p>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="h-12 w-12 rounded-full bg-primary">
                                <img src="https://api.cloudnouns.com/v1/pfp" alt="Logo" width={48} height={48} />
                            </div>
                            <Button onClick={handleMint}>Mint</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
