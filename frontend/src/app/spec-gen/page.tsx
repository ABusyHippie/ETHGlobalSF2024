'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ShineBorder from '@/components/ui/shine-border';

export default function SpecGen() {
    const [contractAddress, setContractAddress] = useState('');
    const [contractName, setContractName] = useState('');
    const [description, setDescription] = useState('');
    const [abiFile, setAbiFile] = useState<File | null>(null);
    const [markdownPreview, setMarkdownPreview] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically send the data to your backend
        // For now, we'll just update the markdown preview with a placeholder
        setMarkdownPreview(`
# ${contractName}

**Contract Address:** ${contractAddress}

## Description

${description}

## ABI

ABI file uploaded: ${abiFile ? abiFile.name : 'No file uploaded'}

---

This is a placeholder for the generated specification. In a real implementation, 
this would be replaced with the actual response from your backend.
    `);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/5">
                    <Card className="w-full ">
                        <CardHeader>
                            <CardTitle>Spec Generator</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contract-address">Contract Address</Label>
                                    <Input
                                        id="contract-address"
                                        value={contractAddress}
                                        onChange={(e) => setContractAddress(e.target.value)}
                                        placeholder="Enter contract address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contract-name">Contract Name</Label>
                                    <Input id="contract-name" value={contractName} onChange={(e) => setContractName(e.target.value)} placeholder="Enter contract name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter contract description" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="abi-upload">Upload ABI</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input id="abi-upload" type="file" className="hidden" onChange={(e) => setAbiFile(e.target.files?.[0] || null)} />
                                        <Button variant="outline" onClick={() => document.getElementById('abi-upload')?.click()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {abiFile ? abiFile.name : 'Upload ABI'}
                                        </Button>
                                    </div>
                                </div>
                                <Button type="submit">Generate Spec</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="w-full lg:w-3/5">
                    <Card className="w-full h-full bg-transparent border-none shadow-none">
                        <CardHeader>
                            <CardTitle>Markdown Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                                {markdownPreview ? <div dangerouslySetInnerHTML={{ __html: markdownPreview }} /> : <p>Your generated specification will appear here.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
