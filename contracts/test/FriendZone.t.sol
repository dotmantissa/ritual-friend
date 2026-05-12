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
        vm.prank(alice);
        uint256 idx = friendZone.revealFriend(100, "alice", "bob", 10);

        assertLt(idx, 100);
        assertTrue(friendZone.walletHasPaired(alice));
        assertEq(friendZone.walletFriendIndex(alice), idx);
        assertEq(friendZone.totalPairings(), 1);
        assertEq(friendZone.claimedCount(), 2);
        assertTrue(friendZone.isUsernameClaimed("alice"));
        assertTrue(friendZone.isUsernameClaimed("bob"));
    }

    function testSecondRevealRevertsAlreadyPaired() public {
        vm.startPrank(alice);
        friendZone.revealFriend(50, "alice", "bob", 7);
        vm.expectRevert(FriendZone.AlreadyPaired.selector);
        friendZone.revealFriend(50, "alice", "bob", 7);
        vm.stopPrank();
    }

    function testMemberCountZeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(FriendZone.MemberCountZero.selector);
        friendZone.revealFriend(0, "alice", "bob", 0);
    }

    function testInsufficientFeeReverts() public {
        friendZone.setRevealFee(0.1 ether);
        vm.prank(alice);
        vm.expectRevert(FriendZone.InsufficientFee.selector);
        friendZone.revealFriend(10, "alice", "bob", 0);
    }

    function testClaimedUsernameReverts() public {
        vm.prank(alice);
        friendZone.revealFriend(10, "alice", "bob", 0);

        vm.prank(bob);
        vm.expectRevert(FriendZone.UsernameAlreadyClaimed.selector);
        friendZone.revealFriend(10, "alice", "charlie", 1);
    }

    function testOwnerCanWithdraw() public {
        friendZone.setRevealFee(1 ether);
        vm.prank(alice);
        friendZone.revealFriend{ value: 1 ether }(10, "alice", "bob", 1);

        uint256 beforeBal = address(this).balance;
        friendZone.withdraw();
        assertEq(address(friendZone).balance, 0);
        assertEq(address(this).balance, beforeBal + 1 ether);
    }

    receive() external payable {}
}
