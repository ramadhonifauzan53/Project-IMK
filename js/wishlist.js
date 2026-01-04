document.addEventListener("DOMContentLoaded", function () {
  console.log("Wishlist page loaded");

  // Initialize elements
  const wishlistContainer = document.getElementById("wishlist-items");
  const emptyWishlist = document.getElementById("empty-wishlist");
  const wishlistCount = document.getElementById("wishlist-count");
  const wishlistSummary = document.getElementById("wishlist-summary");
  const wishlistSubtotal = document.getElementById("wishlist-subtotal");
  const wishlistTax = document.getElementById("wishlist-tax");
  const wishlistTotalPrice = document.getElementById("wishlist-total-price");
  const wishlistCheckoutBtn = document.getElementById("wishlist-checkout-btn");
  const paymentModal = document.getElementById("paymentModal");
  const closeModalBtns = document.querySelectorAll(".close-modal");
  const paymentAmount = document.getElementById("payment-amount");
  const paymentStatus = document.getElementById("payment-status");
  const confirmPaymentBtn = document.getElementById("confirm-payment");
  let qrcode = null;

  // Make sure we have the latest wishlist data
  if (!localStorage.getItem("wishlist")) {
    console.log(
      "No wishlist found in localStorage, initializing empty wishlist"
    );
    localStorage.setItem("wishlist", "[]");
  }

  // Function to get current wishlist
  function getWishlist() {
    return JSON.parse(localStorage.getItem("wishlist") || "[]");
  }

  // Initial load
  const wishlist = getWishlist();
  console.log("Current wishlist from localStorage:", wishlist);

  // Update wishlist count in the header
  if (wishlistCount) {
    wishlistCount.textContent = wishlist.length;
  }

  // Update wishlist summary
  function updateWishlistSummary() {
    const currentWishlist = getWishlist();
    const subtotal = currentWishlist.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    if (wishlistSubtotal) {
      wishlistSubtotal.textContent = `Rp ${subtotal.toLocaleString("id-ID")}`;
    }
    if (wishlistTax) {
      wishlistTax.textContent = `Rp ${tax.toLocaleString("id-ID")}`;
    }
    if (wishlistTotalPrice) {
      wishlistTotalPrice.textContent = `Rp ${total.toLocaleString("id-ID")}`;
    }

    // Show/hide summary section based on wishlist items
    if (wishlistSummary) {
      wishlistSummary.style.display =
        currentWishlist.length > 0 ? "block" : "none";
    }

    return total;
  }

  // Display wishlist items or empty message
  function renderWishlist() {
    console.log("Rendering wishlist...");
    // Always get fresh data from localStorage
    const currentWishlist = getWishlist();
    console.log("Current wishlist items:", currentWishlist);

    // Make sure all wishlist items have required fields
    const validWishlist = currentWishlist.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.id !== undefined &&
        item.price !== undefined
    );

    // Update the wishlist count in the header
    if (wishlistCount) {
      wishlistCount.textContent = validWishlist.length;
    }

    if (currentWishlist.length === 0) {
      emptyWishlist.style.display = "block";
      if (wishlistContainer) wishlistContainer.style.display = "none";
    } else {
      emptyWishlist.style.display = "none";
      if (wishlistContainer) {
        wishlistContainer.style.display = "grid";
        wishlistContainer.innerHTML = "";
      }

      currentWishlist.forEach((game) => {
        const wishlistItem = document.createElement("div");
        wishlistItem.className = "wishlist-item";
        const discountBadge = game.discount
          ? `<span class="discount-badge">-${Math.round(
              (1 - game.discount) * 100
            )}%</span>`
          : "";

        const originalPrice =
          game.discount && game.originalPrice
            ? `<span class="original-price">Rp ${game.originalPrice.toLocaleString(
                "id-ID"
              )}</span>`
            : "";

        wishlistItem.innerHTML = `
            <img src="${game.image}" alt="${game.title}">
            <div class="wishlist-item-info">
                <h3>${game.title}</h3>
                <p>${game.genre}</p>
                <div class="game-price">
                    ${originalPrice}
                    ${discountBadge}
                    <div class="current-price">Rp ${
                      game.price ? game.price.toLocaleString("id-ID") : "0"
                    }</div>
                </div>
                <div class="wishlist-item-actions">
                    <button class="btn btn-primary add-to-cart" data-id="${
                      game.id
                    }">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="btn btn-danger remove-from-wishlist" data-id="${
                      game.id
                    }">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
        wishlistContainer.appendChild(wishlistItem);
      });

      // Add event listeners to remove buttons
      document.querySelectorAll(".remove-from-wishlist").forEach((button) => {
        button.addEventListener("click", function (e) {
          e.stopPropagation();
          const gameId = parseInt(this.getAttribute("data-id"));
          removeFromWishlist(gameId);
        });
      });

      // Add event listeners to add to cart buttons
      document.querySelectorAll(".add-to-cart").forEach((button) => {
        button.addEventListener("click", function (e) {
          e.stopPropagation();
          const gameId = parseInt(this.getAttribute("data-id"));
          const game = wishlist.find((game) => game.id === gameId);
          addToCart(game);
        });
      });
    }
  }

  // Add to cart function
  function addToCart(game) {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.id === game.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: game.id,
        title: game.title,
        price: game.price,
        image: game.image,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showNotification(`${game.title} added to cart!`);
  }

  // Update cart count in header
  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll("#cart-count");

    cartCountElements.forEach((element) => {
      element.textContent = cartCount;
    });
  }

  // Show notification
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 100);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Remove game from wishlist
  function removeFromWishlist(gameId) {
    const currentWishlist = JSON.parse(
      localStorage.getItem("wishlist") || "[]"
    );
    const updatedWishlist = currentWishlist.filter(
      (game) => game.id !== gameId
    );
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    // Update the display
    renderWishlist();
    updateWishlistSummary();

    // Update the count in the header
    const headerWishlistCount = document.querySelectorAll(
      "#wishlist-count, #wishlist-total"
    );
    headerWishlistCount.forEach((el) => {
      if (el.id === "wishlist-total") {
        el.textContent = `${updatedWishlist.length} items`;
      } else {
        el.textContent = updatedWishlist.length;
      }
    });
  }

  // Generate random transaction ID
  function generateTransactionId() {
    return (
      "TXN" +
      Date.now().toString().slice(-8) +
      Math.floor(1000 + Math.random() * 9000)
    );
  }

  // Checkout button - Show payment modal
  if (wishlistCheckoutBtn) {
    wishlistCheckoutBtn.addEventListener("click", function () {
      const currentWishlist = getWishlist();
      if (currentWishlist.length === 0) {
        showNotification(
          "Your wishlist is empty! Please add some games first."
        );
        return;
      }

      // Add all wishlist items to cart temporarily for checkout
      const tempCart = currentWishlist.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        quantity: 1,
      }));

      const total = updateWishlistSummary();
      if (paymentAmount) {
        paymentAmount.textContent = `Rp ${total.toLocaleString("id-ID")}`;
      }

      // Clear previous QR code if exists
      const qrcodeContainer = document.getElementById("qrcode");
      if (qrcodeContainer) {
        qrcodeContainer.innerHTML = "";
      }

      // Generate payment data
      const paymentData = {
        transactionId: generateTransactionId(),
        amount: total,
        merchant: "GameBox Store",
        timestamp: new Date().toISOString(),
        items: tempCart,
      };

      // Generate QR code
      if (typeof QRCode !== "undefined" && qrcodeContainer) {
        qrcode = new QRCode(qrcodeContainer, {
          text: JSON.stringify(paymentData),
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
        });
      }

      // Reset payment status
      if (paymentStatus) {
        paymentStatus.textContent = "Waiting for payment...";
        paymentStatus.className = "";
      }

      // Reset confirm button
      if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = "I've Made the Payment";
        confirmPaymentBtn.className = "payment-confirm-button";
      }

      // Show the payment modal
      if (paymentModal) {
        paymentModal.style.display = "flex";
        document.body.style.overflow = "hidden";
      }
    });
  }

  // Close modal when clicking the close button
  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (paymentModal) {
        paymentModal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    });
  });

  // Close modal when clicking outside the modal
  window.addEventListener("click", function (event) {
    if (event.target === paymentModal) {
      if (paymentModal) {
        paymentModal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    }
  });

  // Handle payment confirmation
  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener("click", function () {
      // In a real app, you would verify the payment with your payment processor
      // For demo purposes, we'll just show a success message
      if (paymentStatus) {
        paymentStatus.textContent =
          "Payment verified! Thank you for your purchase!";
        paymentStatus.className = "success";
      }

      // Disable the button after payment
      if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = true;
        confirmPaymentBtn.textContent = "Payment Completed";
        confirmPaymentBtn.classList.remove("payment-confirm-button");
        confirmPaymentBtn.classList.add("btn-success");
      }

      // Move wishlist items to cart after successful payment
      const currentWishlist = getWishlist();
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");

      currentWishlist.forEach((wishlistItem) => {
        const existingItem = cart.find((item) => item.id === wishlistItem.id);
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({
            id: wishlistItem.id,
            title: wishlistItem.title,
            price: wishlistItem.price,
            image: wishlistItem.image,
            quantity: 1,
          });
        }
      });

      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();

      // Clear wishlist after successful payment
      setTimeout(() => {
        localStorage.removeItem("wishlist");
        if (paymentModal) {
          paymentModal.style.display = "none";
          document.body.style.overflow = "auto";
        }
        renderWishlist();
        updateWishlistSummary();
        updateCartCount();
        showNotification(
          "Payment successful! Your wishlist items have been added to cart."
        );
      }, 2000);
    });
  }

  // Initial render
  renderWishlist();
  updateWishlistSummary();
});
