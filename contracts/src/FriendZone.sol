// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FriendZone — Ritual Chain Friend Assignment
/// @notice Each wallet calls revealFriend(memberCount) to be assigned a deterministic friend.
contract FriendZone {
    // ── Events ──────────────────────────────────────────────────────
    event FriendRevealed(
        address indexed seeker,
        uint256 indexed friendIndex,
        uint256 memberCount,
        uint256 revealNonce
    );

    // ── Errors ──────────────────────────────────────────────────────
    error MemberCountZero();
    error InsufficientFee();
    error WithdrawFailed();
    error NotOwner();

    // ── State ───────────────────────────────────────────────────────
    address public owner;
    uint256 public revealFee = 0;
    mapping(address => uint256) public revealCount;
    mapping(address => uint256) public lastFriendIndex;
    mapping(address => bool) public hasRevealed;
    uint256 public totalReveals;

    constructor() {
        owner = msg.sender;
    }

    // ── Core ────────────────────────────────────────────────────────
    function revealFriend(uint256 memberCount) external payable returns (uint256 friendIndex) {
        if (memberCount == 0) revert MemberCountZero();
        if (msg.value < revealFee) revert InsufficientFee();

        uint256 nonce = revealCount[msg.sender];

        bytes32 entropy = keccak256(
            abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                msg.sender,
                nonce,
                memberCount
            )
        );

        friendIndex = uint256(entropy) % memberCount;

        revealCount[msg.sender] = nonce + 1;
        lastFriendIndex[msg.sender] = friendIndex;
        hasRevealed[msg.sender] = true;
        totalReveals++;

        emit FriendRevealed(msg.sender, friendIndex, memberCount, nonce);
    }

    // ── Views ───────────────────────────────────────────────────────
    function getRevealInfo(address seeker)
        external
        view
        returns (bool revealed, uint256 lastIndex, uint256 count)
    {
        return (hasRevealed[seeker], lastFriendIndex[seeker], revealCount[seeker]);
    }

    // ── Owner ───────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function setRevealFee(uint256 fee) external onlyOwner {
        revealFee = fee;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner.call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    receive() external payable {}
}
