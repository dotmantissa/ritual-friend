// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FriendZone {
    mapping(address => bool) public hasRevealed;
    mapping(address => uint256) public lastFriendIndex;
    mapping(address => uint256) public revealCount;
    uint256 public totalReveals;
    uint256 public revealFee = 0;
    address public owner;

    event FriendRevealed(
        address indexed seeker,
        uint256 indexed friendIndex,
        uint256 memberCount,
        uint256 nonce
    );

    error MemberCountZero();
    error InsufficientFee();
    error NotOwner();
    error WithdrawFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function revealFriend(uint256 memberCount) external payable returns (uint256 friendIndex) {
        if (memberCount == 0) revert MemberCountZero();
        if (msg.value < revealFee) revert InsufficientFee();

        if (hasRevealed[msg.sender]) {
            friendIndex = lastFriendIndex[msg.sender];
            emit FriendRevealed(msg.sender, friendIndex, memberCount, revealCount[msg.sender] - 1);
            return friendIndex;
        }

        bytes32 entropy = keccak256(
            abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                msg.sender,
                revealCount[msg.sender],
                memberCount
            )
        );

        friendIndex = uint256(entropy) % memberCount;

        revealCount[msg.sender]++;
        lastFriendIndex[msg.sender] = friendIndex;
        hasRevealed[msg.sender] = true;
        totalReveals++;

        emit FriendRevealed(msg.sender, friendIndex, memberCount, revealCount[msg.sender] - 1);
        return friendIndex;
    }

    function setRevealFee(uint256 fee) external onlyOwner {
        revealFee = fee;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner.call{ value: address(this).balance }("");
        if (!ok) revert WithdrawFailed();
    }

    receive() external payable {}
}
