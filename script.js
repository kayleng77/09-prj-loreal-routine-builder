/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineButton = document.getElementById("generateRoutine");
const userInput = document.getElementById("userInput");

// Modal elements
const imageModal = document.getElementById("imageModal");
const modalCloseButton = document.getElementById("modalCloseButton");
const modalMedia = document.getElementById("modalMedia");
const modalBrand = document.getElementById("modalBrand");
const modalName = document.getElementById("modalName");
const modalDescription = document.getElementById("modalDescription");

const selectedProducts = [];
let messages = [
  {role: 'system', content: `You are a helpful assistant that provides beauty routine recommendations based on the users selected products. 
    
    Be concise and provide a step-by-step routine for the user. 
    
    If the user has not selected any products, ask them to select products first. 

    If the user only selects one product, provide a routine that incorporates that product.
    
    Put the routine in a numbered list format so it's easy to follow. 
    
    Use emojis to make the routine more engaging.

    You can recommend additional products that complement the user's selected products, but make sure to explain why they are recommended.

    If the user query is not related to skincare, haircare, makeup, fragrance, and other related areas, politely inform them that you can only provide beauty routine recommendations based on the selected products.`}
];

const workerUrl = 'https://wispy-unit.kayleng77.workers.dev/';

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

modalCloseButton.addEventListener("click", () => {
  imageModal.close();
});

imageModal.addEventListener("click", event => {
  if (event.target === imageModal) {
    imageModal.close();
  }
});

function findProductId(products, productId) {
  return products.find((item) => String(item.id) === productId);
}

function findSelectedIndex(product) {
  return selectedProducts.findIndex((selectedProduct) => selectedProduct.id === product.id);
}


/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

function displayAssistantMessage(message) {
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match;

  chatWindow.replaceChildren();

  while ((match = linkPattern.exec(message)) !== null) {
    chatWindow.append(document.createTextNode(message.slice(lastIndex, match.index)));

    const link = document.createElement("a");
    link.href = match[2];
    link.textContent = match[1];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    chatWindow.append(link);

    lastIndex = linkPattern.lastIndex;
  }

  chatWindow.append(document.createTextNode(message.slice(lastIndex)));
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
            <button id="modalButton" class="modal-button">
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
      if (event.target.closest(".modal-button")) {
        modalMedia.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
        
        modalBrand.textContent = product.brand;
        modalName.textContent = product.name;
        modalDescription.textContent = product.description;
        imageModal.showModal();

        productCard.setAttribute("aria-haspopup", "dialog"); // Indicate that the card opens a modal when activated
        productCard.setAttribute("aria-controls", "imageModal"); // Indicate that the card controls the image modal

        return; // Exit to prevent toggling selection
      }
      toggleProductSelection(product, productCard);
    });

  });
}

function toggleProductSelection(product, productCard) {
  const selectedIndex = findSelectedIndex(product);

  if (selectedIndex === -1) {
    selectedProducts.push(product);
  } else {
    selectedProducts.splice(selectedIndex, 1);
  }

  productCard.classList.toggle("selected");
  productCard.setAttribute("aria-pressed", selectedIndex === -1);
  displaySelectedProducts();
  saveSelectedProducts();
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

loadSelectedProducts(); // Load selected products from localStorage on page load

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

/* Generate routine button handler */
generateRoutineButton.addEventListener("click", async (e) => {
  e.preventDefault();
  console.log("Selected products:", selectedProducts);
  chatWindow.innerHTML = "✨ Your beauty routine is being generated ...";
  messages.push({role: 'user', content:`${selectedProducts.map(p => p.name).join(', ')}`});

  try {
    const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({messages: messages,}),
        
      });

    if (!response.ok) {
      throw new Error(`Response failed. Status: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    messages.push({role: 'assistant', content: assistantMessage});
    console.log("Assistant message:", assistantMessage);
    displayAssistantMessage(assistantMessage);

  } catch (error) {
    console.error("Error generating routine:", error);
  }
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "✨ Your beauty advisor is thinking ...";
  messages.push({role: 'user', content: userInput.value});

  try {
    const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({messages: messages,}),
      });
    if(!response.ok) {
      throw new Error(`Response failed. Status: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    messages.push({role: 'assistant', content: assistantMessage}); 
    console.log("Assistant message:", assistantMessage);
    displayAssistantMessage(assistantMessage);

  } catch (error) {
    console.error("Error generating routine:", error);
  }
  finally {
    userInput.value = "";
  }
});


/* Save selected products to local storage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

function loadSelectedProducts() {
  const savedProducts = localStorage.getItem("selectedProducts");
  if (savedProducts) {
    const parsedProducts = JSON.parse(savedProducts);
    selectedProducts.push(...parsedProducts);
    displaySelectedProducts();
  }
}
