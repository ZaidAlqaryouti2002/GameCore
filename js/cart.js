const cartItems = document.getElementById("cart-items");
const cartMessage = document.getElementById("cart-message");
const cartSummary = document.getElementById("cart-summary");
const cartTotal = document.getElementById("cart-total");

let allProducts = [];

function removeFromCart(productId) {
  const cart = getStoredCart().filter(function (item) {
    return String(item.id) !== String(productId);
  });

  localStorage.setItem("gamecore_cart", JSON.stringify(cart));
  displayCart();
  updateCartCount();
}

function displayCart() {
  const cart = getStoredCart();
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartMessage.textContent = "Your cart is empty.";
    cartMessage.hidden = false;
    cartSummary.hidden = true;
    return;
  }

  let total = 0;
  let shownItems = 0;
  cartMessage.hidden = true;

  cart.forEach(function (item) {
    const product = allProducts.find(function (currentProduct) {
      return String(currentProduct.id) === String(item.id);
    });

    if (!product) {
      return;
    }

    shownItems += 1;

    const quantity = Number(item.quantity) || 1;
    const itemTotal = Number(product.price) * quantity;
    total += itemTotal;

    const row = document.createElement("article");
    row.classList.add("cart-item");

    row.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="cart-item-details">
        <h2>${product.name}</h2>
        <p>Quantity: ${quantity}</p>
        <p>$${itemTotal.toFixed(2)}</p>
        <button class="cart-remove-button" type="button">Remove</button>
      </div>
    `;

    cartItems.appendChild(row);

    row.querySelector(".cart-remove-button").addEventListener("click", function () {
      removeFromCart(product.id);
    });
  });

  if (shownItems === 0) {
    cartMessage.textContent = "Cart products are no longer available.";
    cartMessage.hidden = false;
    cartSummary.hidden = true;
    return;
  }

  cartTotal.textContent = "$" + total.toFixed(2);
  cartSummary.hidden = false;
}

async function loadCart() {
  if (getStoredCart().length === 0) {
    displayCart();
    return;
  }

  try {
    allProducts = await getProducts();
    displayCart();
  } catch (error) {
    cartMessage.textContent = "Could not load your cart. Please try again.";
    console.error(error);
  }
}

loadCart();
