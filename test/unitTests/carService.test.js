const { describe, it, before } = require("mocha")
const CarService = require("../../src/service/carService")
const Transaction = require("../../src/entities/transaction")

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

  it("given a carCategory, customer and numberOfDays it should calculate final amount in real", async () => {
    const customer = Object.create(fixtures.validCustomer)
    customer.age = 50

    const carCategory = Object.create(fixtures.validCarCategory)
    carCategory.price = 37.6

    const numberOfDays = 5

    // age: 50 - 1.3 tax - categoryPrice 37.6
    // 37.6 * 1.3 = 48,88 * 5 days = 244.40
    // don't be dependent from external data
    sandbox
      .stub(carService, "taxesBasedOnAge")
      .get(() => [{ from: 40, to: 50, then: 1.3 }])

    const expected = carService.currencyFormat.format(244.4)
    const result = carService.calculateFinalPrice(
      customer,
      carCategory,
      numberOfDays
    )

    expect(result).to.be.deep.equal(expected)
  })

  it("given a customer and a car category it should return a transaction receipt", async () => {
    const car = fixtures.validCar
    const carCategory = {
      ...fixtures.validCarCategory,
      price: 37.6,
      carIds: [car.id]
    }

    const customer = Object.create(fixtures.validCustomer)
    customer.age = 20

    const numberOfDays = 5
    const dueDate = "24 de maio de 2022"

    const now = new Date(2022, 4, 19)
    sandbox.useFakeTimers(now.getTime())

    sandbox
      .stub(carService.carRepository, carService.carRepository.find.name)
      .resolves(car)

    // age: 20, tax: 1.1, categoryPrice: 37.6
    // 37.6 * 1.1 = 41.36 * 5 days = 206.8

    const expectedAmount = carService.currencyFormat.format(206.8)
    const result = await carService.rent(customer, carCategory, numberOfDays)
    const expected = new Transaction({
      customer,
      car,
      dueDate,
      amount: expectedAmount
    })

    expect(result).to.be.deep.equal(expected)
  })
})
