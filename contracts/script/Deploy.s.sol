// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/FriendZone.sol";

contract DeployFriendZone is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        FriendZone friendZone = new FriendZone();
        console.log("FriendZone deployed at:", address(friendZone));

        vm.stopBroadcast();
    }
}
