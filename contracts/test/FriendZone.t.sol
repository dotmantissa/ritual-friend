// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FriendZone.sol";

contract FriendZoneTest is Test {
    FriendZone fz;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        fz = new FriendZone();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function testRevealEmitsAndStores() public {
        vm.prank(alice);
        uint256 idx = fz.revealFriend(100);
        assertLt(idx, 100);
        assertTrue(fz.hasRevealed(alice));
        assertEq(fz.lastFriendIndex(alice), idx);
        assertEq(fz.revealCount(alice), 1);
    }

    function testSecondRevealReturnsSameIndex() public {
        vm.startPrank(alice);
        uint256 first = fz.revealFriend(50);
        uint256 second = fz.revealFriend(50);
        vm.stopPrank();

        assertEq(first, second);
        assertEq(fz.revealCount(alice), 1);
    }

    function testSecondRevealSkipsFeeCheck() public {
        vm.prank(alice);
        fz.revealFriend(10);

        fz.setRevealFee(1 ether);

        vm.prank(alice);
        uint256 idx = fz.revealFriend(10);

        assertEq(idx, fz.lastFriendIndex(alice));
    }

    function testMemberCountZeroRevertsWhenFirstReveal() public {
        vm.prank(alice);
        vm.expectRevert(FriendZone.MemberCountZero.selector);
        fz.revealFriend(0);
    }

    function testInsufficientFeeReverts() public {
        fz.setRevealFee(0.001 ether);
        vm.prank(alice);
        vm.expectRevert(FriendZone.InsufficientFee.selector);
        fz.revealFriend(10);
    }
}
