export const pairContractAbi = {
    "abi": [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_tokenA",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_tokenB",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_owner",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_factory",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "cancelOffer",
            "inputs": [
                {
                    "name": "_offerId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "createOffer",
            "inputs": [
                {
                    "name": "_swapDirection",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "_amountOffered",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_amountRequested",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_deadline",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_privateTaker",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "factory",
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
            "name": "getOfferById",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "tuple",
                    "internalType": "struct OTCPair.Offer",
                    "components": [
                        {
                            "name": "maker",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "taker",
                            "type": "address",
                            "internalType": "address"
                        },
                        {
                            "name": "swapDirection",
                            "type": "bool",
                            "internalType": "bool"
                        },
                        {
                            "name": "amountOffered",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "amountRequested",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "deadline",
                            "type": "uint256",
                            "internalType": "uint256"
                        },
                        {
                            "name": "isActive",
                            "type": "bool",
                            "internalType": "bool"
                        }
                    ]
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getOpenOffersByAddress",
            "inputs": [
                {
                    "name": "maker",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getOpenOffersCountByAddress",
            "inputs": [
                {
                    "name": "maker",
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
            "name": "getTotalOpenOfferCount",
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
            "name": "isPairRetired",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
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
            "name": "rescueToken",
            "inputs": [
                {
                    "name": "token",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setRetired",
            "inputs": [
                {
                    "name": "_isRetired",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "takeOffer",
            "inputs": [
                {
                    "name": "_offerId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "tokenA",
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
            "name": "tokenB",
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
            "name": "OfferCanceled",
            "inputs": [
                {
                    "name": "offerId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "maker",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "OfferCreated",
            "inputs": [
                {
                    "name": "offerId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "maker",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "taker",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "swapDirection",
                    "type": "bool",
                    "indexed": false,
                    "internalType": "bool"
                },
                {
                    "name": "amountOffered",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "amountRequested",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "deadline",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "OfferTaken",
            "inputs": [
                {
                    "name": "offerId",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "maker",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "taker",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "makerFee",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "takerFee",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
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
            "type": "error",
            "name": "AmountOfferTooLow",
            "inputs": []
        },
        {
            "type": "error",
            "name": "AmountRequestedTooLow",
            "inputs": []
        },
        {
            "type": "error",
            "name": "BalanceIsZero",
            "inputs": []
        },
        {
            "type": "error",
            "name": "DeadlineTooShort",
            "inputs": []
        },
        {
            "type": "error",
            "name": "EthNotRequired",
            "inputs": []
        },
        {
            "type": "error",
            "name": "EthRefundFailed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "EthToMakerFailed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "EthToTakerFailed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "EthTransferFailed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "FeeReceiverNotSet",
            "inputs": []
        },
        {
            "type": "error",
            "name": "FeeToReceiverFailed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "IncorrectEthSent",
            "inputs": [
                {
                    "name": "expected",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "received",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "NoOpenOffers",
            "inputs": [
                {
                    "name": "maker",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "NonStandardERC20",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotAuthorizedFactory",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotAuthorizedTaker",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotOfferMaker",
            "inputs": []
        },
        {
            "type": "error",
            "name": "OfferDoesNotExist",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "OfferExpired",
            "inputs": [
                {
                    "name": "timestampNow",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "deadline",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "OfferInactive",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
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
            "name": "PairRetired",
            "inputs": []
        },
        {
            "type": "error",
            "name": "ReentrancyGuardReentrantCall",
            "inputs": []
        },
        {
            "type": "error",
            "name": "SafeERC20FailedOperation",
            "inputs": [
                {
                    "name": "token",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        }
    ]
}