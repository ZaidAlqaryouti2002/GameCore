const productMessage = document.getElementById("product-message");
const productDetails = document.getElementById("product-details");

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    productMessage.textContent = "Product not found.";
    return;
  }

  try {
    const products = await getProducts();

    const product = products.find(function (item) {
      return String(item.id) === productId;
    });

    if (!product) {
      productMessage.textContent = "Product not found.";
      return;
    }

    document.title = product.name + " | GameCore";

    productDetails.innerHTML = `
      <img src="${product.image}" alt="${product.name}">

      <div class="product-description">
        <p>${product.category}</p>
        <h1>${product.name}</h1>
        <p>${product.brand}</p>
        <p>${product.description}</p>
        <p class="details-price">$${Number(product.price).toFixed(2)}</p>
        <p>In stock: ${product.stock}</p>
        <button id="product-add-button" type="button">Add to Cart</button>
      </div>
    `;

    productMessage.hidden = true;
    productDetails.hidden = false;

    const addButton = document.getElementById("product-add-button");
    const cart = getStoredCart();

    const isInCart = cart.some(function (item) {
      return String(item.id) === productId;
    });

    if (isInCart) {
      addButton.textContent = "In Cart";
      addButton.disabled = true;
    } else if (Number(product.stock) <= 0) {
      addButton.textContent = "Out of Stock";
      addButton.disabled = true;
    }

    addButton.addEventListener("click", function () {
      const savedCart = getStoredCart();

      const alreadyAdded = savedCart.some(function (item) {
        return String(item.id) === productId;
      });

      if (!alreadyAdded) {
        savedCart.push({ id: product.id, quantity: 1 });
        localStorage.setItem("gamecore_cart", JSON.stringify(savedCart));
        updateCartCount();
      }

      addButton.textContent = "In Cart";
      addButton.disabled = true;
    });
  } catch (error) {
    productMessage.textContent = "Could not load the product. Please try again.";
    console.error(error);
  }
}

loadProduct();