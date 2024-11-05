import {
  Claimed as ClaimedEvent, FixedStaking,
  Staked as StakedEvent,
  Unstaked as UnstakedEvent,
} from "../generated/FixedStaking/FixedStaking"
import { FixedStakeHistory, FixedStakingInfo } from "../generated/schema";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

export function handleClaimed(event: ClaimedEvent): void {
  let entity = new FixedStakeHistory(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.account = event.params.staker
  entity.amount = event.params.rewards
  entity.type = "CLAIMED"
  entity.stakeType = event.params.stakeType
  entity.positionId = event.params.positionId

  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.hash = event.transaction.hash

  saveUserStakes(event.address, event.params.staker, event.params.stakeType, event.params.positionId)

  entity.save()
}

export function handleStaked(event: StakedEvent): void {
  let entity = new FixedStakeHistory(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.account = event.params.staker
  entity.amount = event.params.amount
  entity.type = "STAKED"
  entity.stakeType = event.params.stakeType
  entity.positionId = event.params.positionId

  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.hash = event.transaction.hash

  saveUserStakes(event.address, event.params.staker, event.params.stakeType, event.params.positionId)

  entity.save()
}

export function handleUnstaked(event: UnstakedEvent): void {
  let entity = new FixedStakeHistory(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.account = event.params.staker
  entity.amount = event.params.amount
  entity.type = "UNSTAKED"
  entity.stakeType = event.params.stakeType
  entity.positionId = event.params.positionId

  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.hash = event.transaction.hash

  saveUserStakes(event.address, event.params.staker, event.params.stakeType, event.params.positionId)

  entity.save()
}

function saveUserStakes(address: Address, userAddress: Address, stakeType: i32, positionId: BigInt): void {
  const fixedStakingContract = FixedStaking.bind(address)

  const userStakes = fixedStakingContract.userStakingInfo(userAddress, stakeType, positionId)

  let idString = userAddress.toHex() + "-" + stakeType.toString() + "-" + positionId.toString();
  const id = Bytes.fromUTF8(idString)

  const stakingInfo = FixedStakingInfo.load(id)
  if (stakingInfo) {
    stakingInfo.apr = userStakes.getApr()
    stakingInfo.stakedAmount = userStakes.getAmount()
    stakingInfo.stakedAt = userStakes.getStakingTime()
    stakingInfo.save()
  } else {
    const newStakingInfo = new FixedStakingInfo(id)
    newStakingInfo.account = userAddress
    newStakingInfo.apr = userStakes.getApr()
    newStakingInfo.stakedAmount = userStakes.getAmount()
    newStakingInfo.stakedAt = userStakes.getStakingTime()
    newStakingInfo.stakeType = stakeType
    newStakingInfo.positionId = positionId
    newStakingInfo.save()
  }
}
