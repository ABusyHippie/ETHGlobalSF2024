// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin's IERC20 interface
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SafeTokenTransfer {
    address public owner;

    // Event declaration
    event TokensSent(address indexed from, address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender; // Initialize the owner
    }

    // Function to safely send tokens
    function sendTokens(address token, address recipient, uint256 amount) public {
        require(recipient != address(0), "Recipient cannot be the zero address");
        require(amount > 0, "Amount must be greater than zero");

        // Transfer tokens and check for success
        bool success = IERC20(token).transfer(recipient, amount);
        require(success, "Token transfer failed");

        // Emit the TokensSent event
        emit TokensSent(msg.sender, recipient, amount);
    }

    // Function to retrieve the balance of tokens in this contract
    function getTokenBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}