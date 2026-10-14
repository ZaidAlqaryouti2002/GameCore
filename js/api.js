const PRODUCTS_URL =
  "https://6acf791903feaa52b21e960e.mockapi.io/api/v1/Products";

async function getProducts() {
  const response = await fetch(PRODUCTS_URL);

  if (!response.ok) {
    throw new Error("Could not load products.");
  }

  const products = await response.json();

  return products;
}