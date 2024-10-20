Live Demo Link - TO ADD

# Zendit - Secure Blockchain Transaction Verification
Zend It ensures secure blockchain transactions by allowing users to verify details before signing, especially with Ledger hardware wallets. Using ZKPs and building on Polygon, Zend It offers transparent, risk-free interactions with smart contracts, putting users in full control.

## Overview

Zend It is a developer tool designed to provide secure and transparent blockchain transactions, especially when using Ledger hardware wallets. It enhances user confidence by offering a preview and then a transaction verification before signing, using a multi-step process that ensures accuracy and safety.

## Key Features 

### Transaction Verification
When a user initiates a transaction, such as a swap on Polygon or Unichain, Zend It introduces a verification step before signing. This prevents accidental or malicious transactions from proceeding without scrutiny.

### Ledger Integration
For users with a Ledger wallet, Zend It uses Ledger's **clear signing** feature. If the smart contract is pre-approved by Ledger, the transaction details are displayed directly on the Ledger device, allowing the user to review every aspect before approval.

### EIP-712 For Everyone
Zend It uses the EIP-712 standard to handle off-chain to on-chain communication securely using a zero knowledge virtual machine. This proof is returned to the user along with a clear message explaining the transaction’s intent. The smart contract's data is formatted in JSON, verified, and then presented in a clear, understandable format for the user.

### Polygon zkApp
Built as a zkApp on the Polygon blockchain, Zend It leverages the speed, scalability, and security of Polygon’s layer-2 solution, integrating zero-knowledge proofs directly into the transaction’s execution trace. We prove the transaction would occur on chain in a safe and private manner, off chain, using zkm.

### Integration Beyond Ledger
ZendIt is a Developer’s Tool for allowing users to verify ANY contract with or without ledger but you still get that strong EIP 712 Experience for any transaction your users interact with.


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
- **Ledger API** To verify transaction details directly on the Ledger hardware wallet, ensuring that users can review                   the transaction securely before signing.
- **Node.Js**, **Express** Our backend API. Used for handeling incoming requests from the frontend and to perform   
                           critical transaction verifications.
-**Ethers.js** For blockchain interactions, we used Ethers.js to communicate with smart contracts on Polygon and 
               Unichain. This library simplifies contract calls, allowing us to fetch the contract’s ABI and decode 
               input data.
- **Zero-Knowledge Proofs (ZKP)** We used ZKM, to generate ZKPs, which ensures the transaction simulation results can 
                                  be trusted and verified EIP712’s as well as their provable execution trace for all 
                                  preceding transactions if the execution were to have taken place. For contracts that aren’t pre-approved by Ledger, Zend It will allow any contract to be both verifiable and clear!
- **Polygon zkApp** for integrating zero-knowledge proofs on-chain.
- **EIP-712** for structured transaction data.
- **Temper.rs** For non-approved contracts, the backend simulates the transaction by recreating it in a safe 
                environment. This simulation helps ensure the transaction will execute as expected without any 
                unexpected consequences. 
- **React**, **Typescript, JSON** for data formatting and communication with backend APIs.
- **Etherscan** for contract verification and ABI retrieval.
- **Polygon RPC**  for simulating the chain’s real time data utilizing an off chain ZKM.

### **How It All Fits Together:**
When a user initiates a transaction, Zend It kicks in to offer verification before signing. The frontend sends transaction data like the abi and 712 payload to the zkm backend, where it’s processed for Ledger’s clear signing and simulates transactions ahead of time in a verifiable manner. If the contract is approved by Ledger, users see the transaction details on their Ledger wallet screen. If not, the backend simulates the transaction, fetches the contract ABI from Etherscan, and decodes the transaction’s data. A ZKP is generated to prove the simulation was correct without revealing sensitive information. This information is then sent back to the frontend, where the user can review all details before deciding to sign the transaction. By giving the user a path to understand and an opportunity to review the transaction using the Clear Messaging Standard, detailed in the JSON response, that is formatted for the user to see the clear text version of their contract, in readable format, Zend It empowers users to make more informed, and thus safer and better decisions, prior to final verification.  

## A Critical Discovery
we can allow a ledger device to interact with unverified EIP 712 standard contacts that do not implement ERC7730,  Zend It funnels users into ERC7730 compliance. 
---

**Join us** in bringing secure, transparent blockchain interactions to everyone through Zendit!
