// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FriendZone.sol";

contract FriendZoneTest is Test {
    FriendZone internal friendZone;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        friendZone = new FriendZone();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function testRevealStoresState() public {
        bytes32 aliceHash = keccak256(bytes("alice"));
        vm.prank(alice);
        uint256 idx = friendZone.revealFriend(100, aliceHash);

        assertLt(idx, 100);
        assertTrue(friendZone.walletHasPaired(alice));
        assertEq(friendZone.walletFriendIndex(alice), idx);
        assertEq(friendZone.totalPairings(), 1);
        assertEq(friendZone.claimedCount(), 1);
        assertTrue(friendZone.isUsernameClaimed(aliceHash));
    }

    function testSecondRevealRevertsAlreadyPaired() public {
        bytes32 aliceHash = keccak256(bytes("alice"));
        vm.startPrank(alice);
        friendZone.revealFriend(50, aliceHash);
        vm.expectRevert(FriendZone.AlreadyPaired.selector);
        friendZone.revealFriend(50, aliceHash);
        vm.stopPrank();
    }

    function testMemberCountZeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(FriendZone.MemberCountZero.selector);
        friendZone.revealFriend(0, keccak256(bytes("alice")));
    }

    function testInsufficientFeeReverts() public {
        friendZone.setRevealFee(0.1 ether);
        vm.prank(alice);
        vm.expectRevert(FriendZone.InsufficientFee.selector);
        friendZone.revealFriend(10, keccak256(bytes("alice")));
    }

    function testClaimedUsernameReverts() public {
        bytes32 aliceHash = keccak256(bytes("alice"));
        vm.prank(alice);
        friendZone.revealFriend(10, aliceHash);

        vm.prank(bob);
        vm.expectRevert(FriendZone.UsernameAlreadyClaimed.selector);
        friendZone.revealFriend(10, aliceHash);
    }

    function testOwnerCanWithdraw() public {
        friendZone.setRevealFee(1 ether);
        vm.prank(alice);
        friendZone.revealFriend{ value: 1 ether }(10, keccak256(bytes("alice")));

        uint256 beforeBal = address(this).balance;
        friendZone.withdraw();
        assertEq(address(friendZone).balance, 0);
        assertEq(address(this).balance, beforeBal + 1 ether);
    }

    receive() external payable {}
}
