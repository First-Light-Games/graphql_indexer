import { Bytes, BigInt } from "@graphprotocol/graph-ts";

import {
  Account,
  AccountBalance,
  ERC721AccountBalance,
  Token,
} from "../generated/schema";

import { BIGINT_ZERO } from "./common/constants";

export function isNewAccount(accountAddress: Bytes): boolean {
  let accountId = accountAddress;
  let existingAccount = Account.load(accountId);

  if (existingAccount != null) {
    return false;
  }

  return true;
}

export function getOrCreateAccount(accountAddress: Bytes): Account {
  let accountId = accountAddress;
  let existingAccount = Account.load(accountId);

  if (existingAccount != null) {
    return existingAccount as Account;
  }

  let newAccount = new Account(accountId);
  newAccount.tokenCount = BIGINT_ZERO;

  return newAccount;
}

export function getOrCreateERC721AccountBalance(
  account: Bytes,
  collection: Bytes
): ERC721AccountBalance {
  let balanceId = account.concat(Bytes.fromUTF8("-")).concat(collection);
  let previousBalance = ERC721AccountBalance.load(balanceId);

  if (previousBalance != null) {
    return previousBalance as ERC721AccountBalance;
  }

  let newBalance = new ERC721AccountBalance(balanceId);
  newBalance.account = account;
  newBalance.collection = collection;
  newBalance.tokenCount = BIGINT_ZERO;

  return newBalance;
}

export function getOrCreateAccountBalance(
  account: Account,
  token: Token
): AccountBalance {
  let balanceId = Bytes.fromHexString(account.id.toHex()).concat(Bytes.fromUTF8("-")).concat(Bytes.fromHexString(token.id.toHex()));
  let previousBalance = AccountBalance.load(balanceId);

  if (previousBalance != null) {
    return previousBalance as AccountBalance;
  }

  let newBalance = new AccountBalance(balanceId);
  newBalance.account = account.id;
  newBalance.token = token.id;
  newBalance.amount = BIGINT_ZERO;

  return newBalance;
}

export function increaseAccountBalance(
  account: Account,
  token: Token,
  amount: BigInt
): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token);
  balance.amount = balance.amount.plus(amount);

  return balance;
}

export function decreaseAccountBalance(
  account: Account,
  token: Token,
  amount: BigInt
): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token);
  balance.amount = balance.amount.minus(amount);
  if (balance.amount < BIGINT_ZERO) {
    balance.amount = BIGINT_ZERO;
  }

  return balance;
}
