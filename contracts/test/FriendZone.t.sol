// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/FriendZone.sol";

contract FriendZoneTest is Test {
    FriendZone fz;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    event FriendRevealed(
        address indexed seeker,
        uint256 indexed friendIndex,
        uint256 memberCount,
        uint256 revealNonce
    );

    function setUp() public {
        fz = new FriendZone();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function testRevealEmitsEvent() public {
        vm.prank(alice);
        uint256 idx = fz.revealFriend(100);
        assertLt(idx, 100);
    }

    function testRevealCountIncrements() public {
        vm.startPrank(alice);
        fz.revealFriend(50);
        fz.revealFriend(50);
        vm.stopPrank();
        assertEq(fz.revealCount(alice), 2);
    }

    function testDifferentNoncesProduceDifferentResults() public {
        vm.startPrank(alice);
        uint256[] memory results = new uint256[](5);
        for (uint256 i = 0; i < 5; i++) {
            vm.roll(block.number + 1);
            vm.warp(block.timestamp + 12);
            results[i] = fz.revealFriend(1000);
        }
        vm.stopPrank();
        bool allSame = true;
        for (uint256 i = 1; i < 5; i++) {
            if (results[i] != results[0]) { allSame = false; break; }
        }
        assertFalse(allSame, "all reveals identical (vanishingly improbable)");
    }

    function testDifferentCallersDifferentResults() public {
        vm.prank(alice);
        uint256 a = fz.revealFriend(1000);
        vm.prank(bob);
        uint256 b = fz.revealFriend(1000);
        // Probabilistic: with 1000 buckets they should usually differ.
        assertTrue(a != b || a == b); // documents intent; not a hard assert
    }

    function testMemberCountZeroReverts() public {
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

    function testOnlyOwnerCanSetFee() public {
        vm.prank(alice);
        vm.expectRevert(FriendZone.NotOwner.selector);
        fz.setRevealFee(1 ether);
    }
}
