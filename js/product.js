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
    function updateButton() {
      const isInCart = getStoredCart().some(function (item) {
        return String(item.id) === productId;
      });

      addButton.classList.toggle("remove-from-cart", isInCart);

      if (isInCart) {
        addButton.textContent = "Remove from Cart";
        addButton.disabled = false;
      } else if (Number(product.stock) <= 0) {
        addButton.textContent = "Out of Stock";
        addButton.disabled = true;
      } else {
        addButton.textContent = "Add to Cart";
        addButton.disabled = false;
      }
    }

    addButton.addEventListener("click", function () {
      const savedCart = getStoredCart();

      const alreadyAdded = savedCart.some(function (item) {
        return String(item.id) === productId;
      });

      if (alreadyAdded) {
        const updatedCart = savedCart.filter(function (item) {
          return String(item.id) !== productId;
        });

        localStorage.setItem("gamecore_cart", JSON.stringify(updatedCart));
      } else if (Number(product.stock) > 0) {
        savedCart.push({ id: product.id, quantity: 1 });
        localStorage.setItem("gamecore_cart", JSON.stringify(savedCart));
      }

      updateCartCount();
      updateButton();
    });

    updateButton();
  } catch (error) {
    productMessage.textContent = "Could not load the product. Please try again.";
    console.error(error);
  }
}

loadProduct();
