function updateCartNumber() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartNumberEls = document.querySelectorAll('.cart-number');

  cartNumberEls.forEach(el => {
    el.textContent = totalQuantity;
  });
}

// Run when DOM is fully loaded (safer than window.load)
document.addEventListener("DOMContentLoaded", () => {
  updateCartNumber(); // ✅ Make sure this runs on all pages
});

// Optional loader logic (only if you're using a page loader)
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("hide");
    setTimeout(() => loader.style.display = "none", 300);
  }
});



document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const closeMenu = document.getElementById("closeMenu");
  const navLinks = document.getElementById("navLinks");
  const toggleCategories = document.getElementById("toggleCategories");
  const categoryList = document.getElementById("categoryListHome");
  const toggleIcon = document.getElementById("toggleIcon");

  // Open menu
  menuToggle.addEventListener("click", () => {
    navLinks.classList.add("show");
    document.body.classList.add("no-scroll");
  });

  // Close menu
  closeMenu.addEventListener("click", () => {
    navLinks.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });

  // Toggle categories
  toggleCategories.addEventListener("click", (e) => {
    e.preventDefault();
    categoryList.classList.toggle("show");
    toggleIcon.textContent = categoryList.classList.contains("show") ? "–" : "+";
  });
});






