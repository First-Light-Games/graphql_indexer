import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { ERC721 } from "../generated/Corpos/ERC721";
import { ERC721Token, Collection } from "../generated/schema";

export function normalize(strValue: string): string {
  if (strValue.length == 1 && strValue.charCodeAt(0) == 0) {
    return "";
  }

  for (let i = 0; i < strValue.length; i++) {
    if (strValue.charCodeAt(i) == 0) {
      // graph-node db does not support string with '\u0000'
      strValue = strValue.substr(0, i) + "\ufffd" + strValue.substr(i + 1);
    }
  }
  return strValue;
}

export function getOrCreateToken(
  contract: ERC721,
  tokenCollection: Collection,
  tokenId: BigInt,
  timestamp: BigInt
): ERC721Token {
  let contractTokenId = tokenCollection.id
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromUTF8(tokenId.toString()));
  let existingToken = ERC721Token.load(contractTokenId);

  if (existingToken != null) {
    return existingToken as ERC721Token;
  }

  let newToken = new ERC721Token(contractTokenId);
  newToken.collection = tokenCollection.id;
  newToken.tokenID = tokenId;
  newToken.mintTime = timestamp;
  newToken.lastUpdatedTime = timestamp;
  if (tokenCollection.supportsERC721Metadata) {
    let metadataURI = contract.try_tokenURI(tokenId);
    if (!metadataURI.reverted) {
      newToken.tokenURI = normalize(metadataURI.value);
    }
  }

  return newToken;
}