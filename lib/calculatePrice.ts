import BigNumber from "bignumber.js";
import { ParsedUrlQuery } from "querystring";
import { products } from "./products";

export default function calculatePrice(query: ParsedUrlQuery): BigNumber {
  let amount = new BigNumber(0);
  for (let [id, quantity] of Object.entries(query)) { // loop through the query and get the id and quantity of the items that the user selected.
    const product = products.find(p => p.id === id) // get the product that the user selected.
    if (!product) continue; // if the product is not found then skip it.

    const price = product.priceUsd; // get the price of the product.
    const productQuantity = new BigNumber(quantity as string) // get the quantity of the product. we convert it to a big number.
    amount = amount.plus(productQuantity.multipliedBy(price)) // add the price of the product to the total price. we multiply the quantity by the price.
  }

  return amount
}
