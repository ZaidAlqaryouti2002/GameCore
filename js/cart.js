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
    const stock = Number(product.stock);
    const itemTotal = Number(product.price) * quantity;
    total += itemTotal;

    const row = document.createElement("article");
    row.classList.add("cart-item");

    row.innerHTML = `
      <img src="${product.image}" alt="${product.name}">

      <div class="cart-item-details">
        <h2>${product.name}</h2>

        <div
          class="quantity-controls"
          role="group"
          aria-label="Product quantity"
        >
          <button
            class="quantity-minus"
            type="button"
            aria-label="Decrease quantity"
          >
            &minus;
          </button>

          <span class="quantity-value">${quantity}</span>

          <button
            class="quantity-plus"
            type="button"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <p>$${itemTotal.toFixed(2)}</p>

        <button class="cart-remove-button" type="button">
          Remove
        </button>
      </div>
    `;

    cartItems.appendChild(row);

    const minusButton = row.querySelector(".quantity-minus");
    const plusButton = row.querySelector(".quantity-plus");
    const removeButton = row.querySelector(".cart-remove-button");

    minusButton.disabled = quantity <= 1;
    plusButton.disabled = quantity >= stock;

    function changeQuantity(amount) {
      const savedCart = getStoredCart();

      const cartItem = savedCart.find(function (savedItem) {
        return String(savedItem.id) === String(product.id);
      });

      if (!cartItem) {
        return;
      }

      const newQuantity = Number(cartItem.quantity) + amount;

      if (newQuantity < 1 || newQuantity > stock) {
        return;
      }

      cartItem.quantity = newQuantity;

      localStorage.setItem("gamecore_cart", JSON.stringify(savedCart));
      displayCart();
      updateCartCount();
    }

    minusButton.addEventListener("click", function () {
      changeQuantity(-1);
    });

    plusButton.addEventListener("click", function () {
      changeQuantity(1);
    });

    removeButton.addEventListener("click", function () {
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
    cartMessage.hidden = false;
    cartMessage.textContent =
      "Could not load your cart. Please try again.";
    console.error(error);
  }
}

loadCart();