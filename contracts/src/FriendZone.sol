// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FriendZone {
    event FriendRevealed(
        address indexed wallet,
        uint256 indexed friendIndex,
        uint256 memberCount,
        string seekerUsername
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
    constructor() {
        owner = msg.sender;
    }

    function revealFriend(uint256 memberCount, string calldata seekerUsername) external payable returns (uint256 chainIndex) {
        if (memberCount == 0) revert MemberCountZero();
        if (msg.value < revealFee) revert InsufficientFee();
        if (walletHasPaired[msg.sender]) revert AlreadyPaired();

        bytes32 seekerHash = keccak256(abi.encodePacked(_lower(seekerUsername)));

        if (usernameHashClaimed[seekerHash]) revert UsernameAlreadyClaimed();

        bytes32 entropy = keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, memberCount));
        chainIndex = uint256(entropy) % memberCount;

        walletFriendIndex[msg.sender] = chainIndex;
        walletHasPaired[msg.sender] = true;
        usernameHashClaimed[seekerHash] = true;
        usernameToWallet[seekerHash] = msg.sender;
        walletToUsernameHash[msg.sender] = seekerHash;
        totalPairings++;
        claimedCount += 1;

        emit FriendRevealed(msg.sender, chainIndex, memberCount, seekerUsername);
    }

    function isUsernameClaimed(string calldata username) external view returns (bool) {
        return usernameHashClaimed[keccak256(abi.encodePacked(_lower(username)))];
    }

    function getWalletPairing(address wallet) external view returns (bool paired, uint256 friendIndex) {
        return (walletHasPaired[wallet], walletFriendIndex[wallet]);
    }

    function _lower(string calldata s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory result = new bytes(b.length);
        for (uint256 i = 0; i < b.length; i++) {
            result[i] = (b[i] >= 0x41 && b[i] <= 0x5A) ? bytes1(uint8(b[i]) + 32) : b[i];
        }
        return string(result);
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
