const cartContainer = document.getElementById('cart-container');

function renderCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  cartContainer.innerHTML = cart.map((item, index) => `
    <div class="container-2">
      <div class="productandquantity">
        <div class="cart-item">
          <div class="cart-img">
            <img src="${item.image}" alt="">
          </div>
          <div class="cart-details">
            <p class="cart-item-title">${item.name}</p>
            <p>#${item.price.toLocaleString()}</p>
            <p>Size: ${item.size}</p>
          </div>
        </div>

        <div class="quantity-btn-grid">
          <div class="quantity-btn">
            <span class="decrease" data-index="${index}">-</span>
            <span class="count">${item.quantity}</span>
            <span class="increase" data-index="${index}">+</span>
          </div>
          <i class="fa-light fa-trash" data-index="${index}"></i>
        </div>
      </div>

      <div class="cart-total align-right">
        <p>#${(item.price * item.quantity).toLocaleString()}</p>
      </div>
    </div>
    <hr>
  `).join('');

  attachEventListeners();
  updateSubtotal(cart);
  updateCartNumber();
}

function attachEventListeners() {

  // ===============================
  // INCREASE QUANTITY
  // ===============================
  document.querySelectorAll('.increase').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = btn.dataset.index;
      let cart = JSON.parse(localStorage.getItem('cart'));
      const item = cart[index];

      const stock = item.availableInventory ?? 0;

      // Prevent exceeding inventory
      if (item.quantity >= stock) {
        showToast(`Only ${stock} available`);
        return;
      }

      item.quantity++;
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
    });
  });

  // ===============================
  // DECREASE QUANTITY
  // ===============================
  document.querySelectorAll('.decrease').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = btn.dataset.index;
      let cart = JSON.parse(localStorage.getItem('cart'));

      if (cart[index].quantity > 1) {
        cart[index].quantity--;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
      }
    });
  });

  // ===============================
  // DELETE ITEM
  // ===============================
  document.querySelectorAll('.fa-trash').forEach(icon => {
    icon.addEventListener('click', () => {
      const index = icon.dataset.index;
      let cart = JSON.parse(localStorage.getItem('cart'));
      cart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
    });
  });
}

function updateCartNumber() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  document.querySelectorAll('.cart-number').forEach(el => {
    el.textContent = totalQuantity;
  });
}

function updateSubtotal(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalPriceEl = document.querySelector('.subtotal-price');

  if (subtotalPriceEl) {
    subtotalPriceEl.textContent = `₦${subtotal.toLocaleString()}`;
  }
}

document.addEventListener("DOMContentLoaded", renderCart);

// Prevent empty cart checkout
document.getElementById("checkoutBtn").addEventListener("click", function (e) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    e.preventDefault();
    showToast("Add products to cart first.");
  }
});

// Toast popup
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 3000);
}
