const { describe, it, before } = require("mocha")
const CarService = require("../../src/service/carService")

const { join } = require("path")
const { expect } = require("chai")
const sinon = require("sinon")
let { sandbox } = require("sinon")

const carsDatabase = join(__dirname, "../../database", "cars.json")

const fixtures = {
  validCarCategory: require("../fixtures/valid-carCategory.json"),
  validCar: require("../fixtures/valid-car.json"),
  validCustomer: require("../fixtures/valid-customer.json")
}

describe("CarService Suite Tests", () => {
  let carService = {}

  before(() => {
    carService = new CarService({
      cars: carsDatabase
    })
  })

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  it("given a carCategory it should return an available car", async () => {
    const car = fixtures.validCar
    const carCategory = Object.create(fixtures.validCarCategory)
    carCategory.carIds = [car.id]

    sandbox
      .stub(carService.carRepository, carService.carRepository.find.name)
      .resolves(car)

    sandbox.spy(carService, carService.chooseRandomCar.name)

    const result = await carService.getAvailableCar(carCategory)
    const expected = car

    expect(carService.chooseRandomCar.calledOnce).to.be.ok
    expect(carService.carRepository.find.calledWithExactly(car.id)).to.be.ok
    expect(result).to.be.deep.equal(expected)
  })

  it("should retrieve a random position from an array", () => {
    const data = [0, 1, 2, 3, 4, 5]
    const result = carService.getRandomPositionFromArray(data)

    expect(result).to.be.lte(data.length).and.be.gte(0)
  })

  it("should choose the first id from carIds in carCategory", () => {
    const carCategory = fixtures.validCarCategory
    const carIdIndex = 0

    sandbox
      .stub(carService, carService.getRandomPositionFromArray.name)
      .returns(carIdIndex)

    const result = carService.chooseRandomCar(carCategory)
    const expected = carCategory.carIds[carIdIndex]

    expect(carService.getRandomPositionFromArray.calledOnce).to.be.ok
    expect(result).to.be.equal(expected)
  })
})
