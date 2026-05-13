// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FriendZone {
    event FriendRevealed(
        address indexed wallet,
        uint256 indexed friendIndex,
        bytes32 indexed seekerUsernameHash,
        uint256 memberCount
    );

    error AlreadyPaired();
    error UsernameAlreadyClaimed();
    error MemberCountZero();
    error InsufficientFee();
    error NotOwner();

    address public owner;
    uint256 public revealFee = 0;
    uint256 public totalPairings;
    uint256 public claimedCount;

    mapping(address => uint256) public walletFriendIndex;
    mapping(address => bool) public walletHasPaired;
    mapping(bytes32 => bool) public usernameHashClaimed;
    mapping(bytes32 => address) public usernameToWallet;
    mapping(address => bytes32) public walletToUsernameHash;
    mapping(uint256 => bool) public indexClaimed;
    constructor() {
        owner = msg.sender;
    }

    function revealFriend(uint256 memberCount, bytes32 seekerUsernameHash) external payable returns (uint256 chainIndex) {
        if (memberCount == 0) revert MemberCountZero();
        if (msg.value < revealFee) revert InsufficientFee();
        if (walletHasPaired[msg.sender]) revert AlreadyPaired();

        if (usernameHashClaimed[seekerUsernameHash]) revert UsernameAlreadyClaimed();

        bytes32 entropy = keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, memberCount));
        chainIndex = uint256(entropy) % memberCount;
        indexClaimed[chainIndex] = true;

        walletFriendIndex[msg.sender] = chainIndex;
        walletHasPaired[msg.sender] = true;
        usernameHashClaimed[seekerUsernameHash] = true;
        usernameToWallet[seekerUsernameHash] = msg.sender;
        walletToUsernameHash[msg.sender] = seekerUsernameHash;
        totalPairings++;
        claimedCount += 1;

        emit FriendRevealed(msg.sender, chainIndex, seekerUsernameHash, memberCount);
    }

    function isUsernameClaimed(bytes32 usernameHash) external view returns (bool) {
        return usernameHashClaimed[usernameHash];
    }

    function isIndexClaimed(uint256 index) external view returns (bool) {
        return indexClaimed[index];
    }

    function getWalletPairing(address wallet) external view returns (bool paired, uint256 friendIndex) {
        return (walletHasPaired[wallet], walletFriendIndex[wallet]);
    }

    function setRevealFee(uint256 fee) external {
        if (msg.sender != owner) revert NotOwner();
        revealFee = fee;
    }

    function withdraw() external {
        if (msg.sender != owner) revert NotOwner();
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
