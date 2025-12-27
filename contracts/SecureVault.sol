// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAuthorizationManager {
    function verifyAuthorization(
        address vault,
        address recipient,
        uint256 amount,
        uint256 chainId,
        bytes32 nonce,
        bytes calldata signature
    ) external returns (bool);
}

contract SecureVault {
    IAuthorizationManager public authManager;
    bool public initialized;
    
    event Deposit(address indexed from, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount, bytes32 nonce);
    
    error AlreadyInitialized();
    error NotInitialized();
    error InsufficientBalance();
    error TransferFailed();
    
    function initialize(address _authManager) external {
        if (initialized) revert AlreadyInitialized();
        authManager = IAuthorizationManager(_authManager);
        initialized = true;
    }
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(
        address payable recipient,
        uint256 amount,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        if (!initialized) revert NotInitialized();
        if (address(this).balance < amount) revert InsufficientBalance();
        
        bool valid = authManager.verifyAuthorization(
            address(this),
            recipient,
            amount,
            block.chainid,
            nonce,
            signature
        );
        
        require(valid, "Invalid authorization");
        
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdrawal(recipient, amount, nonce);
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}