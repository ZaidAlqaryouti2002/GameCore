const PRODUCTS_URL =
  "https://6acf791903feaa52b21e960e.mockapi.io/api/v1/Products";

const USERS_URL =
  "https://6acf791903feaa52b21e960e.mockapi.io/api/v1/users";

async function getProducts() {
  const response = await fetch(PRODUCTS_URL);

  if (!response.ok) {
    throw new Error("Could not load products.");
  }

  const products = await response.json();

  return products;
}

async function createProduct(product) {
  const response = await fetch(PRODUCTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    throw new Error("Could not add the product. Please try again.");
  }

  return response.json();
}

async function updateProduct(id, product) {
  const response = await fetch(PRODUCTS_URL + "/" + encodeURIComponent(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    throw new Error("Could not update the product. Please try again.");
  }

  return response.json();
}

async function deleteProduct(id) {
  const response = await fetch(PRODUCTS_URL + "/" + encodeURIComponent(id), {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Could not delete the product. Please try again.");
  }
}

async function getUsers() {
  const response = await fetch(USERS_URL);

  if (!response.ok) {
    throw new Error("Could not load accounts. Please try again.");
  }

  const users = await response.json();

  if (!Array.isArray(users)) {
    throw new Error("Could not load accounts. Please try again.");
  }

  return users;
}

async function findUserByEmail(email) {
  const users = await getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  return users.find(function (user) {
    return String(user.email || "").trim().toLowerCase() === normalizedEmail;
  }) || null;
}

async function createUser(user) {
  const response = await fetch(USERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });

  if (!response.ok) {
    throw new Error("Could not create your account. Please try again.");
  }

  return response.json();
}
