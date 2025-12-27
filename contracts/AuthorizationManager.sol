// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract AuthorizationManager {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    mapping(bytes32 => bool) public usedNonces;
    address public signer;
    bool public initialized;
    
    event AuthorizationUsed(bytes32 indexed nonce);
    
    error AlreadyInitialized();
    error AlreadyUsed();
    error InvalidSignature();
    
    function initialize(address _signer) external {
        if (initialized) revert AlreadyInitialized();
        signer = _signer;
        initialized = true;
    }
    
    function verifyAuthorization(
        address vault,
        address recipient,
        uint256 amount,
        uint256 chainId,
        bytes32 nonce,
        bytes calldata signature
    ) external returns (bool) {
        if (usedNonces[nonce]) revert AlreadyUsed();
        
        bytes32 message = keccak256(
            abi.encodePacked(vault, recipient, amount, chainId, nonce)
        );
        
        bytes32 digest = message.toEthSignedMessageHash();
        
        if (digest.recover(signature) != signer) revert InvalidSignature();
        
        usedNonces[nonce] = true;
        emit AuthorizationUsed(nonce);
        
        return true;
    }
}