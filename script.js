/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

const selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;



/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

function selectionChecker(selectedProduct) {
    return selectedProducts.some((product) => product.id === selectedProduct.id);
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products.map(
      (product) => {
        const isSelected = selectionChecker(product);

        return `
        <div class="product-card ${isSelected ? "selected" : ""}"
          data-product-id="${product.id}"
          role="button"
          tabindex="0"
          aria-pressed="${isSelected}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <button id="productModal" class="productModal">
              Learn More
            </button>
          </div>
        </div>
      `;
      }
    )
    .join("");

  // add event listeners to each product card after they are added to the DOM
  productsContainer.querySelectorAll(".product-card").forEach((productCard) => {
    const product = findProductId(products, productCard.dataset.productId);

    // Add click event listener to select the product when the card is clicked
    productCard.addEventListener("click", (event) => {
      // prevent toggling if the click is on the "Learn More" button
      if (event.target.closest(".productModal")) {
        return;
      }
      addProductSelection(product, productCard);
    });

  });
}

function findProductId(products, productId) {
  return products.find((item) => String(item.id) === productId);
}

function findSelectedIndex(product) {
  return selectedProducts.findIndex((selectedProduct) => selectedProduct.id === product.id);
}

/* Add a product and keep the card and selected list in sync */
function addProductSelection(product, productCard) {
  const selectedIndex = findSelectedIndex(product);

  if (selectedIndex === -1) {
    selectedProducts.push(product);
  }

  productCard.classList.add("selected");
  productCard.setAttribute("aria-pressed", "true");
  displaySelectedProducts();
}

/* Show the products currently in the user's routine */
function displaySelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = "<p>No products selected yet.</p>";
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product" data-product-id="${product.id}">
          <strong>${product.name}</strong>
          <span>${product.brand}</span>
        </div>
      `
    )
    .join("");
}

selectedProductsList.addEventListener("click", (event) => {
  const selectedProductCard = event.target.closest(".selected-product");

  if (!selectedProductCard) {
    return;
  }

  const productId = selectedProductCard.dataset.productId;
  const selectedIndex = selectedProducts.findIndex(
    (product) => String(product.id) === productId
  );

  if (selectedIndex === -1) {
    return;
  }

  selectedProducts.splice(selectedIndex, 1);
  productsContainer.querySelectorAll(".product-card").forEach((productCard) => {
    if (productCard.dataset.productId === productId) {
      productCard.classList.remove("selected");
      productCard.setAttribute("aria-pressed", "false");
    }
  });
  displaySelectedProducts();
});

displaySelectedProducts();

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});



/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
