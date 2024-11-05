import {
  AprUpdated as AprUpdatedEvent,
  Claimed as ClaimedEvent, FlexibleStaking,
  Staked as StakedEvent,
  Unstaked as UnstakedEvent
} from "../generated/FlexibleStaking/FlexibleStaking"
import {
  AprUpdated, FlexibleStakeHistory, FlexibleStakingInfo,
} from "../generated/schema"
import { Address } from "@graphprotocol/graph-ts";

export function handleAprUpdated(event: AprUpdatedEvent): void {
  let entity = new AprUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newApr = event.params.newApr

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleStaked(event: StakedEvent): void {
  let entity = new FlexibleStakeHistory(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.user
  entity.amount = event.params.amount
  entity.type = "STAKE"

  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.hash = event.transaction.hash

  saveUserStakes(event.address, event.params.user)

  entity.save()
}

export function handleClaimed(event: ClaimedEvent): void {
  let entity = new FlexibleStakeHistory(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.user
  entity.amount = event.params.rewards
  entity.type = "CLAIMED"

  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.hash = event.transaction.hash

  saveUserStakes(event.address, event.params.user)

  entity.save()
}

export function handleUnstaked(event: UnstakedEvent): void {
  let entity = new FlexibleStakeHistory(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.account = event.params.user
  entity.amount = event.params.amount
  entity.type = "UNSTAKE"

  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.hash = event.transaction.hash

  saveUserStakes(event.address, event.params.user)

  entity.save()
}

function saveUserStakes(address: Address, userAddress: Address): void {
  const flexibleStakingContract = FlexibleStaking.bind(address)
  const stakingInfo = FlexibleStakingInfo.load(userAddress)
  if (stakingInfo) {
    const stakes = flexibleStakingContract.userStakes(userAddress)
    stakingInfo.apr = stakes.getLastApr()
    stakingInfo.stakedAmount = stakes.getAmount()
    stakingInfo.lastClaimedAt = stakes.getLastClaimedAt()
    stakingInfo.rewards = stakes.getRewards()
    stakingInfo.save()
  } else {
    const newStakingInfo = new FlexibleStakingInfo(userAddress)
    newStakingInfo.account = userAddress
    const stakes = flexibleStakingContract.userStakes(userAddress)
    newStakingInfo.apr = stakes.getLastApr()
    newStakingInfo.stakedAmount = stakes.getAmount()
    newStakingInfo.lastClaimedAt = stakes.getLastClaimedAt()
    newStakingInfo.rewards = stakes.getRewards()
    newStakingInfo.save()
  }
}
