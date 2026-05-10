// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FriendZone.sol";

contract FriendZoneTest is Test {
    FriendZone internal friendZone;
    address internal alice = address(0xA11CE);

    function setUp() public {
        friendZone = new FriendZone();
        vm.deal(alice, 10 ether);
    }

    function testRevealStoresStateAndEmits() public {
        vm.prank(alice);
        uint256 idx = friendZone.revealFriend(100);

        assertLt(idx, 100);
        assertTrue(friendZone.hasRevealed(alice));
        assertEq(friendZone.lastFriendIndex(alice), idx);
        assertEq(friendZone.revealCount(alice), 1);
        assertEq(friendZone.totalReveals(), 1);
    }

    function testSecondRevealReturnsSameIndexAndDoesNotIncrement() public {
        vm.startPrank(alice);
        uint256 first = friendZone.revealFriend(50);
        uint256 second = friendZone.revealFriend(50);
        vm.stopPrank();

        assertEq(first, second);
        assertEq(friendZone.revealCount(alice), 1);
        assertEq(friendZone.totalReveals(), 1);
    }

    function testMemberCountZeroReverts() public {
        vm.prank(alice);
        vm.expectRevert(FriendZone.MemberCountZero.selector);
        friendZone.revealFriend(0);
    }

    function testInsufficientFeeReverts() public {
        friendZone.setRevealFee(0.1 ether);
        vm.prank(alice);
        vm.expectRevert(FriendZone.InsufficientFee.selector);
        friendZone.revealFriend(10);
    }

    function testOwnerCanWithdraw() public {
        vm.prank(alice);
        friendZone.revealFriend{ value: 1 ether }(10);

        friendZone.setRevealFee(0);
        uint256 beforeBal = address(this).balance;
        friendZone.withdraw();
        assertEq(address(friendZone).balance, 0);
        assertEq(address(this).balance, beforeBal + 1 ether);
    }

    receive() external payable {}
}
