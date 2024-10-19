# Zendit - Secure Blockchain Transaction Verification

## Overview

Zendit is a powerful developer tool designed to enhance the security of blockchain transactions, particularly when interacting with smart contracts on Polygon and Unichain using a Ledger hardware wallet. By integrating zero-knowledge proof (ZKP) techniques, Zendit ensures that users can verify their transactions before signing, offering a seamless and secure interaction with blockchain systems.

Our project takes advantage of Ledger's **clear signing feature** and builds a zkApp on **Polygon** as part of our commitment to providing secure and transparent transaction verifications. Whether or not the contract is pre-approved by Ledger, Zendit offers robust verification options that put the user in full control.

## How It Works

### 1. **User Initiates a Transaction**
The user initiates a swap transaction that involves interacting with smart contracts (such as on Polygon or Unichain). At this point, Zendit steps in to provide a critical security checkpoint.

### 2. **Verification Button**
Before proceeding, a "Verify" button appears in the interface. When clicked, this triggers a verification process to ensure the transaction details are accurate and trustworthy.

### 3. **Ledger Clear Signing Check**

- **For Ledger-Approved Contracts**:  
  If the user is utilizing a Ledger hardware wallet and the smart contract is pre-approved by Ledger, Zendit leverages **Ledger's clear signing feature**. This feature enables users to see the transaction details directly on their Ledger device before signing, providing full transparency and confidence.

- **For Non-Ledger Approved Contracts**:  
  If the smart contract is not pre-approved, Zendit uses an alternative verification workflow to ensure safety and accuracy.

### 4. **EIP-712 Smart Contract Execution**
Zendit uses the EIP-712 standard to handle off-chain to on-chain communication securely. A set of parameters is formatted in JSON and posted to the relevant endpoint. Once verified, the smart contract can be signed, either via Ledger's clear signing or through alternative workflows, depending on contract status.

## Alternative Verification Workflow (for Non-Approved Contracts)

1. **Sending Data to Backend**:  
   The transaction input data and contract address are sent to the backend API for further analysis.

2. **Backend Processing**:
   - **Simulate the Transaction**: The backend simulates the transaction to ensure it behaves as expected and doesn’t pose any risk.
   - **Generate a Zero-Knowledge Proof (ZKP)**: This ZKP confirms that the transaction simulation was done correctly without exposing sensitive details.
   - **Fetch the ABI**: The backend retrieves the contract's ABI (Application Binary Interface) from a trusted source like Etherscan.
   - **Decode Input Data**: Using the ABI, the backend decodes the transaction data to determine the functions and inputs involved.

3. **Construct Clear Signing Message**:  
   A clear, human-readable message is generated, detailing what the transaction will do and allowing the user to understand exactly what they are approving.

4. **Returning Verification Details**:  
   The backend sends the ZKP and the clear signing message back to the frontend for the user's review.

5. **User Reviews and Proceeds**:  
   The user reviews both the clear signing message and the ZKP. If everything checks out, they can confidently proceed to sign the transaction.

## Why Zendit?

- **Ledger Integration**: Seamless use of Ledger’s clear signing feature for contract verification.
- **Zero-Knowledge Proofs (ZKPs)**: Enhanced security through ZKPs, ensuring the privacy and accuracy of transaction simulations.
- **Polygon zkApp**: Built on the Polygon network, Zendit brings fast and secure transaction verifications at scale.
- **User-Centric Transparency**: Gives users a clear view of their transaction details before signing, reducing risk and enhancing trust.

By combining these elements, Zendit offers a cutting-edge solution for developers and end-users alike, ensuring blockchain transactions are always transparent, safe, and reliable.

---

#### Tech Stack
- **Ledger Hardware Wallet** for secure transaction signing.
- **Polygon zkApp** for integrating zero-knowledge proofs on-chain.
- **EIP-712** for structured transaction data.
- **Typescript, JSON** for data formatting and communication with backend APIs.
- **Etherscan** for contract verification and ABI retrieval.

---

**Join us** in bringing secure, transparent blockchain interactions to everyone through Zendit!