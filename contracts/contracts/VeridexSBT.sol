// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Soulbound seal — hash pointer only, no file/URL/PII
contract VeridexSBT {
    struct Seal {
        bytes32 contentHash;
        bytes32 schema;
        uint64 issuedAt;
        uint64 expiresAt; // 0 = none
        bool revoked;
        bytes32 docId;
        bytes32 sigHash; // keccak256(appSignature)
    }

    address public minter;
    string public baseURI;
    uint256 public nextId = 1;
    mapping(uint256 => Seal) seals;
    mapping(uint256 => address) owners;
    mapping(bytes32 => uint256) docToToken;

    event Sealed(
        address indexed to,
        uint256 indexed tokenId,
        bytes32 docId,
        bytes32 contentHash,
        bytes32 schema,
        bytes32 sigHash
    );
    event Revoked(uint256 indexed tokenId, bytes32 docId);

    constructor(address _minter, string memory _base) {
        minter = _minter;
        baseURI = _base;
    }

    // Only Veridex backend mints
    function seal(
        address to,
        bytes32 docId,
        bytes32 contentHash,
        bytes32 schema,
        uint64 expiresAt,
        bytes32 sigHash
    ) external returns (uint256 tokenId) {
        require(msg.sender == minter, "not-minter");
        tokenId = nextId++;
        seals[tokenId] = Seal(
            contentHash,
            schema,
            uint64(block.timestamp),
            expiresAt,
            false,
            docId,
            sigHash
        );
        owners[tokenId] = to;
        docToToken[docId] = tokenId;
        emit Sealed(to, tokenId, docId, contentHash, schema, sigHash);
    }

    function revoke(uint256 tokenId) external {
        require(msg.sender == minter, "not-minter");
        seals[tokenId].revoked = true;
        emit Revoked(tokenId, seals[tokenId].docId);
    }

    function getSeal(uint256 tokenId) external view returns (Seal memory) {
        return seals[tokenId];
    }
    function tokenOfDoc(bytes32 docId) external view returns (uint256) {
        return docToToken[docId];
    }
    function ownerOf(uint256 tokenId) external view returns (address) {
        return owners[tokenId];
    }
    // Metadata via API, never S3 URL
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        return string.concat(baseURI, _toString(tokenId));
    }

    // Soulbound lock
    function transferFrom(address, address, uint256) external pure {
        revert("soulbound");
    }
    function safeTransferFrom(address, address, uint256) external pure {
        revert("soulbound");
    }
    function approve(address, uint256) external pure {
        revert("soulbound");
    }
    function setApprovalForAll(address, bool) external pure {
        revert("soulbound");
    }

    function _toString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        bytes memory b;
        while (v > 0) {
            b = abi.encodePacked(bytes1(uint8(48 + (v % 10))), b);
            v /= 10;
        }
        return string(b);
    }
}
