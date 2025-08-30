export const pairContractAbi = {
    "abi": [
        {
            "type": "constructor",
            "inputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "allPairs",
            "inputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "createPair",
            "inputs": [
                {
                    "name": "tokenA",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenB",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "feeReceiver",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getPair",
            "inputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getPairAmount",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getPairId",
            "inputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "ocbAddress",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "owner",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "renounceOwnership",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "retirePair",
            "inputs": [
                {
                    "name": "tokenA",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenB",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setFeeReceiver",
            "inputs": [
                {
                    "name": "receiver",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setOCBAddress",
            "inputs": [
                {
                    "name": "_ocbAddress",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "transferOwnership",
            "inputs": [
                {
                    "name": "newOwner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "event",
            "name": "FeeReceiverSet",
            "inputs": [
                {
                    "name": "receiver",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "OwnershipTransferred",
            "inputs": [
                {
                    "name": "previousOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "newOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "PairCreated",
            "inputs": [
                {
                    "name": "tokenA",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "tokenB",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "pair",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "index",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "PairRetired",
            "inputs": [
                {
                    "name": "pair",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "index",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "IdenticalTokens",
            "inputs": []
        },
        {
            "type": "error",
            "name": "OwnableInvalidOwner",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "OwnableUnauthorizedAccount",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "PairDoesNotExist",
            "inputs": [
                {
                    "name": "tokenA",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenB",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "PairExists",
            "inputs": [
                {
                    "name": "tokenA",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenB",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        }
    ]
}