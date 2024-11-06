import { store, Bytes } from "@graphprotocol/graph-ts";

import {
  Transfer as TransferEvent,
  ERC721,
} from "../generated/Corpos/ERC721";
import {
  Collection,
  ERC721Transfer as Transfer,
  ERC721AccountBalance as AccountBalance,
} from "../generated/schema";

import {
  BIGINT_ZERO,
  BIGINT_ONE,
  GENESIS_ADDRESS,
} from "./common/constants";
import {
  getOrCreateAccount,
  getOrCreateERC721AccountBalance,
} from "./account";
import { normalize, getOrCreateToken } from "./erc721-token";

export function handleTransfer(event: TransferEvent): void {
  let from = event.params.from.toHex();
  let to = event.params.to.toHex();
  if (from == GENESIS_ADDRESS && to == GENESIS_ADDRESS) {
    // skip if the transfer is from zero address to zero address
    return;
  }

  // determine whether this transfer is related with ERC721 collection
  let tokenId = event.params.tokenId;
  let id = event.address.toHex() + "-" + tokenId.toString();
  let collectionId = Bytes.fromHexString(event.address.toHex());
  let contract = ERC721.bind(event.address);
  let tokenCollection = Collection.load(collectionId);
  if (tokenCollection == null) {
    // check whether this collection has already been verified to be non-ERC721 contract to avoid to make contract calls again.

    tokenCollection = getOrCreateCollection(
      contract,
      collectionId,
      true,
    );
  }

  // update metrics on the sender side
  let currentOwner = getOrCreateAccount(Bytes.fromHexString(from));
  if (from == GENESIS_ADDRESS) {
    // mint a new token
    tokenCollection.tokenCount = tokenCollection.tokenCount.plus(BIGINT_ONE);
  } else {
    // transfer an existing token from non-zero address
    let currentAccountBalanceId = Bytes.fromHexString(from)
      .concat(Bytes.fromUTF8("-"))
      .concat(collectionId);
    let currentAccountBalance = AccountBalance.load(currentAccountBalanceId);
    if (currentAccountBalance != null) {
      currentAccountBalance.tokenCount = currentAccountBalance.tokenCount.minus(
        BIGINT_ONE
      );
      currentAccountBalance.blockNumber = event.block.number;
      currentAccountBalance.timestamp = event.block.timestamp;
      currentAccountBalance.save();

      if (currentAccountBalance.tokenCount.equals(BIGINT_ZERO)) {
        tokenCollection.ownerCount = tokenCollection.ownerCount.minus(
          BIGINT_ONE
        );
      }
    }

    if (currentOwner != null) {
      currentOwner.tokenCount = currentOwner.tokenCount.minus(BIGINT_ONE);
    }
  }
  currentOwner.save();

  // update metrics on the receiver side
  if (to == GENESIS_ADDRESS) {
    // burn an existing token
    store.remove("ERC721Token", id);
    tokenCollection.tokenCount = tokenCollection.tokenCount.minus(BIGINT_ONE);
  } else {
    // transfer a new or existing token to non-zero address
    let newOwner = getOrCreateAccount(Bytes.fromHexString(to));
    newOwner.tokenCount = newOwner.tokenCount.plus(BIGINT_ONE);
    newOwner.save();

    let token = getOrCreateToken(
      contract,
      tokenCollection,
      tokenId,
      event.block.timestamp
    );
    token.owner = newOwner.id;
    token.save();

    let newAccountBalance = getOrCreateERC721AccountBalance(Bytes.fromHexString(to), collectionId);
    newAccountBalance.tokenCount = newAccountBalance.tokenCount.plus(
      BIGINT_ONE
    );
    newAccountBalance.blockNumber = event.block.number;
    newAccountBalance.timestamp = event.block.timestamp;
    newAccountBalance.save();

    if (newAccountBalance.tokenCount.equals(BIGINT_ONE)) {
      tokenCollection.ownerCount = tokenCollection.ownerCount.plus(BIGINT_ONE);
    }
  }

  // update aggregate data for sender and receiver
  tokenCollection.transferCount = tokenCollection.transferCount.plus(
    BIGINT_ONE
  );
  tokenCollection.save();

  createTransfer(event).save();
}

function getOrCreateCollection(
  contract: ERC721,
  CollectionAddress: Bytes,
  supportsERC721Metadata: boolean
): Collection {
  let previousTokenCollection = Collection.load(CollectionAddress);

  if (previousTokenCollection != null) {
    return previousTokenCollection as Collection;
  }

  let tokenCollection = new Collection(CollectionAddress);
  tokenCollection.supportsERC721Metadata = supportsERC721Metadata;
  tokenCollection.tokenCount = BIGINT_ZERO;
  tokenCollection.ownerCount = BIGINT_ZERO;
  tokenCollection.transferCount = BIGINT_ZERO;

  let name = contract.try_name();
  if (!name.reverted) {
    tokenCollection.name = normalize(name.value);
  }
  let symbol = contract.try_symbol();
  if (!symbol.reverted) {
    tokenCollection.symbol = normalize(symbol.value);
  }

  return tokenCollection;
}

function createTransfer(event: TransferEvent): Transfer {
  let transfer = new Transfer(
    Bytes.fromHexString(event.address.toHex())
      .concat(Bytes.fromUTF8("-"))
      .concat(event.transaction.hash)
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromI32(event.logIndex.toI32()))
  );
  transfer.hash = event.transaction.hash;
  transfer.logIndex = event.logIndex.toI32();
  transfer.collection = Bytes.fromHexString(event.address.toHex());
  transfer.nonce = event.transaction.nonce.toI32();
  transfer.tokenId = event.params.tokenId;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;

  return transfer;
}