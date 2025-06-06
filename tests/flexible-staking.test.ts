import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { AprUpdated } from "../generated/schema"
import { AprUpdated as AprUpdatedEvent } from "../generated/FlexibleStaking/FlexibleStaking"
import { handleAprUpdated } from "../src/flexible-staking"
import { createAprUpdatedEvent } from "./flexible-staking-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let newApr = BigInt.fromI32(234)
    let newAprUpdatedEvent = createAprUpdatedEvent(newApr)
    handleAprUpdated(newAprUpdatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("AprUpdated created and stored", () => {
    assert.entityCount("AprUpdated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "AprUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newApr",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
