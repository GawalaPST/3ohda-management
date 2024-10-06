// script.js

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBs16oG9LOGusyoL5p0TlGpjZoNScPhwqE",
  authDomain: "ohda-john.firebaseapp.com",
  projectId: "ohda-john",
  storageBucket: "ohda-john.appspot.com",
  messagingSenderId: "45108192967",
  appId: "1:45108192967:web:397b84201e33945b7600e2",
  measurementId: "G-BS2CRVZS0F"

  };
    
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  // DOM Elements
  const authSection = document.getElementById('auth-section');
  const loginForm = document.getElementById('login-form');
  const adminSection = document.getElementById('admin-section');
  const userSection = document.getElementById('user-section');
  const logoutAdminBtn = document.getElementById('logout-admin');
  const logoutUserBtn = document.getElementById('logout-user');
  const productForm = document.getElementById('product-form');
  const productsTableBody = document.querySelector('#products-table tbody');
  const userProductsDiv = document.getElementById('user-products');
  const reservationsTableBody = document.querySelector('#reservations-table tbody');
  const reservationsApprovalTableBody = document.querySelector('#reservations-approval-table tbody');
  
  // Modals and Forms
  const createUserBtn = document.getElementById('create-user-btn');
  const createUserModal = document.getElementById('create-user-modal');
  const createUserForm = document.getElementById('create-user-form');
  const newUserEmail = document.getElementById('new-user-email');
  const newUserPassword = document.getElementById('new-user-password');
  const newUserRole = document.getElementById('new-user-role');
  
  const createRoleBtn = document.getElementById('create-role-btn');
  const createRoleModal = document.getElementById('create-role-modal');
  const createRoleForm = document.getElementById('create-role-form');
  const newRoleName = document.getElementById('new-role-name');
  
  const editProductModal = document.getElementById('edit-product-modal');
  const editProductForm = document.getElementById('edit-product-form');
  const editProductNameEn = document.getElementById('edit-product-name-en');
  const editProductNameAr = document.getElementById('edit-product-name-ar');
  const editProductCounter = document.getElementById('edit-product-counter');
  const editProductImage = document.getElementById('edit-product-image');
  
  const switchUserModeBtn = document.getElementById('switch-user-mode-btn');
  
  // Search Elements
  const searchInput = document.getElementById('search-input');
  const resetSearchBtn = document.getElementById('reset-search-btn');
  
  // Toast Notification Function
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
  
    const toast = document.createElement('div');
    toast.classList.add('toast', 'fade', 'show');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
  
    let bgColor;
    switch (type) {
      case 'success':
        bgColor = 'bg-success text-white';
        break;
      case 'error':
        bgColor = 'bg-danger text-white';
        break;
      case 'warning':
        bgColor = 'bg-warning text-dark';
        break;
      default:
        bgColor = 'bg-info text-white';
    }
  
    toast.innerHTML = `
      <div class="toast-header ${bgColor}">
        <strong class="mr-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button type="button" class="ml-2 mb-1 close text-white" data-dismiss="toast" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
  
    toastContainer.appendChild(toast);
  
    // Automatically remove the toast after 5 seconds
    setTimeout(() => {
      $(toast).toast('hide');
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, 5000);
  }
  
  // Utility Function to Show/Hide Sections
  function showSection(show, hide1, hide2) {
    if (show) show.classList.remove('hidden');
    if (hide1) hide1.classList.add('hidden');
    if (hide2) hide2.classList.add('hidden');
  }
  
  // Authentication State Listener
  auth.onAuthStateChanged(user => {
    if (user) {
      // Fetch user role from Firestore
      db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          if (userData.role === 'superadmin' || userData.role === 'admin') {
            showAdminSection();
          } else {
            showUserSection();
          }
        } else {
          console.log('لا يوجد مستند مستخدم كهذا!');
          showToast('لم يتم العثور على دور المستخدم. يرجى الاتصال بالمسؤول.', 'error');
          auth.signOut();
        }
      }).catch(error => {
        console.error("حدث خطأ أثناء جلب مستند المستخدم:", error);
        showToast('حدث خطأ أثناء جلب بيانات المستخدم.', 'error');
      });
    } else {
      showSection(authSection, adminSection, userSection);
    }
  });
  
  // Show Admin Section
  function showAdminSection() {
    showSection(adminSection, authSection, userSection);
    loadAdminProducts();
    loadAllReservations(); // For reservation approval
    loadRoles(); // Load roles for user creation
  }
  
  // Show User Section
  function showUserSection() {
    showSection(userSection, authSection, adminSection);
    loadUserProducts();
    loadUserReservations();
  }
  
  // Login Function
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          loginForm.reset();
        })
        .catch(error => {
          showToast(error.message, 'error');
        });
    });
  }
  
  // Logout Functions
  if (logoutAdminBtn) {
    logoutAdminBtn.addEventListener('click', () => {
      auth.signOut();
    });
  }
  
  if (logoutUserBtn) {
    logoutUserBtn.addEventListener('click', () => {
      auth.signOut();
    });
  }
  
  // Admin - Add Product
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameEn = document.getElementById('product-name-en').value.trim();
      const nameAr = document.getElementById('product-name-ar').value.trim();
      const counter = parseInt(document.getElementById('product-counter').value);
      const imageFile = document.getElementById('product-image').files[0];
  
      if (!imageFile) {
        showToast('Please select an image for the product.', 'warning');
        return;
      }
  
      try {
        // Upload Image to Firebase Storage
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`product_images/${Date.now()}_${imageFile.name}`);
        await imageRef.put(imageFile);
        const imageURL = await imageRef.getDownloadURL();
  
        // Add Product to Firestore
        await db.collection('products').add({
          name_en: nameEn,
          name_ar: nameAr,
          stock_count: counter,
          image_url: imageURL,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        productForm.reset();
        showToast('تمت إضافة المنتج بنجاح.', 'success');
      } catch (error) {
        console.error("خطأ في إضافة المنتج:", error);
        showToast('حدث خطأ أثناء إضافة المنتج. يرجى المحاولة مرة أخرى.', 'error');
      }
    });
  }
  
  // Admin - Load Products
  function loadAdminProducts() {
    db.collection('products').orderBy('created_at', 'desc').onSnapshot(snapshot => {
      productsTableBody.innerHTML = '';
      snapshot.forEach(doc => {
        const product = doc.data();
        const tr = document.createElement('tr');
  
        // Image
        const imgTd = document.createElement('td');
        const img = document.createElement('img');
        img.src = product.image_url;
        img.alt = product.name_en;
        img.style.width = '50px';
        img.style.height = '50px';
        img.style.objectFit = 'cover';
        imgTd.appendChild(img);
        tr.appendChild(imgTd);
  
        // English Name
        const nameEnTd = document.createElement('td');
        nameEnTd.textContent = product.name_en;
        tr.appendChild(nameEnTd);
  
        // Arabic Name
        const nameArTd = document.createElement('td');
        nameArTd.textContent = product.name_ar;
        tr.appendChild(nameArTd);
  
        // Stock Count
        const stockTd = document.createElement('td');
        stockTd.textContent = product.stock_count;
        tr.appendChild(stockTd);
  
        // Actions
        const actionsTd = document.createElement('td');
  
        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.classList.add('btn', 'btn-primary', 'btn-sm', 'mr-2');
        editBtn.addEventListener('click', () => {
          openEditProductModal(doc.id, product);
        });
        actionsTd.appendChild(editBtn);
  
        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'مسح';
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm');
        deleteBtn.addEventListener('click', () => {
          if (confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) {
            db.collection('products').doc(doc.id).delete();
          }
        });
        actionsTd.appendChild(deleteBtn);
  
        tr.appendChild(actionsTd);
        productsTableBody.appendChild(tr);
      });
    }, error => {
      console.error("خطأ في تحميل المنتجات:", error);
    });
  }
  
  // Function to Open Edit Product Modal
  function openEditProductModal(productId, productData) {
    if (!editProductModal || !editProductForm) return;
  
    // Populate the form with existing data
    editProductNameEn.value = productData.name_en;
    editProductNameAr.value = productData.name_ar;
    editProductCounter.value = productData.stock_count;
  
    // Handle form submission
    editProductForm.onsubmit = async (e) => {
      e.preventDefault();
      const updatedNameEn = editProductNameEn.value.trim();
      const updatedNameAr = editProductNameAr.value.trim();
      const updatedCounter = parseInt(editProductCounter.value);
      const updatedImageFile = editProductImage.files[0];
  
      try {
        let imageURL = productData.image_url;
  
        if (updatedImageFile) {
          // Upload new image
          const storageRef = storage.ref();
          const imageRef = storageRef.child(`product_images/${Date.now()}_${updatedImageFile.name}`);
          await imageRef.put(updatedImageFile);
          imageURL = await imageRef.getDownloadURL();
        }
  
        // Update Product in Firestore
        await db.collection('products').doc(productId).update({
          name_en: updatedNameEn,
          name_ar: updatedNameAr,
          stock_count: updatedCounter,
          image_url: imageURL,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        showToast('تم تحديث المنتج بنجاح.', 'success');
        editProductForm.reset();
        editProductModal.style.display = 'none'; // Close the modal
      } catch (error) {
        console.error("حدث خطأ أثناء تحديث المنتج:", error);
        showToast('حدث خطأ أثناء تحديث المنتج. يرجى المحاولة مرة أخرى.', 'error');
      }
    };
  
    // Show the modal
    editProductModal.style.display = 'block';
  }
  
  // User - Load Products with Search Functionality
  function loadUserProducts(searchQuery = '') {
    if (!userProductsDiv) return;
  
    userProductsDiv.innerHTML = '';
  
    let query = db.collection('products').orderBy('created_at', 'desc');
  
    // Apply search filters
    query.get().then(snapshot => {
      let found = false;
      snapshot.forEach(doc => {
        const product = doc.data();
        if (
          product.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.name_ar.includes(searchQuery)
        ) {
          displayUserProduct(doc.id, product);
          found = true;
        }
      });
  
      if (!found) {
        const noResultDiv = document.createElement('div');
        noResultDiv.classList.add('col-12', 'text-center', 'text-danger', 'mt-4');
        noResultDiv.textContent = 'لم يتم العثور على منتجات مطابقة لبحثك.';
        userProductsDiv.appendChild(noResultDiv);
      }
    }).catch(error => {
      console.error("Error searching products:", error);
      showToast('خطأ في البحث عن المنتجات. يرجى المحاولة مرة أخرى.', 'error');
    });
  }
  
  // Function to Display User Product
  function displayUserProduct(productId, product) {
    if (!userProductsDiv) return;
  
    const col = document.createElement('div');
    col.classList.add('col-md-4', 'mb-4');
  
    const card = document.createElement('div');
    card.classList.add('card', 'h-100');
  
    const img = document.createElement('img');
    img.src = product.image_url;
    img.classList.add('card-img-top');
    img.alt = product.name_en;
    img.style.height = '150px';
    img.style.objectFit = 'cover';
    card.appendChild(img);
  
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body', 'd-flex', 'flex-column');
  
    const titleAr = document.createElement('h5');
    titleAr.classList.add('card-title');
    titleAr.textContent = product.name_ar;
    cardBody.appendChild(titleAr);
  
    const titleEn = document.createElement('h6');
    titleEn.classList.add('card-subtitle', 'mb-2', 'text-muted');
    titleEn.textContent = product.name_en;
    cardBody.appendChild(titleEn);
  
    const stock = document.createElement('p');
    stock.classList.add('card-text');
    stock.textContent = `الكمية الماحة: ${product.stock_count}`;
    cardBody.appendChild(stock);
  
    // Reservation Form
    const reservationForm = document.createElement('form');
    reservationForm.classList.add('reservation-form', 'mt-auto'); // Pushes form to bottom
  
    // Quantity
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = 1;
    quantityInput.max = product.stock_count;
    quantityInput.placeholder = 'الكمية';
    quantityInput.classList.add('form-control', 'mb-2');
    quantityInput.required = true;
    reservationForm.appendChild(quantityInput);
  
    // Recipient Name
    const recipientNameInput = document.createElement('input');
    recipientNameInput.type = 'text';
    recipientNameInput.placeholder = 'اسم المستلم';
    recipientNameInput.classList.add('form-control', 'mb-2');
    recipientNameInput.required = true;
    reservationForm.appendChild(recipientNameInput);
  
    // Recipient Mobile Number
    const recipientMobileInput = document.createElement('input');
    recipientMobileInput.type = 'text';
    recipientMobileInput.placeholder = 'رقم موبايل المستلم';
    recipientMobileInput.classList.add('form-control', 'mb-2');
    recipientMobileInput.required = true;
    reservationForm.appendChild(recipientMobileInput);
  
    // Unit Dropdown
    const unitSelect = document.createElement('select');
    unitSelect.classList.add('form-control', 'mb-2');
    unitSelect.required = true;
  
    const units = [
      "براعم اولاد",
      "براعم بنات",
      "اشبال",
      "زهرات",
      "كشاف",
      "مرشدات",
      "متقدم",
      "الفا لانج",
      "جوالة وجولات",
      "مرشحين جوالة",
      "فرقة المارش",
      "أخري ( حفلة - معسكر )"
    ];
  
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'اختر الوحدة';
    unitSelect.appendChild(defaultOption);
  
    units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = unit;
      unitSelect.appendChild(option);
    });
  
    reservationForm.appendChild(unitSelect);
  
    // Start Time
    const startTimeInput = document.createElement('input');
    startTimeInput.type = 'datetime-local';
    startTimeInput.classList.add('form-control', 'mb-2');
    startTimeInput.required = true;
    reservationForm.appendChild(startTimeInput);
  
    // End Time
    const endTimeInput = document.createElement('input');
    endTimeInput.type = 'datetime-local';
    endTimeInput.classList.add('form-control', 'mb-2');
    endTimeInput.required = true;
    reservationForm.appendChild(endTimeInput);
  
    // Recurring Reservation Checkbox
    const recurringDiv = document.createElement('div');
    recurringDiv.classList.add('form-group', 'mb-2');
    const recurringCheckbox = document.createElement('input');
    recurringCheckbox.type = 'checkbox';
    recurringCheckbox.id = `recurring-checkbox-${productId}`;
    recurringCheckbox.classList.add('mr-2');
    recurringDiv.appendChild(recurringCheckbox);
  
    const recurringLabel = document.createElement('label');
    recurringLabel.htmlFor = `recurring-checkbox-${productId}`;
    recurringLabel.textContent = 'Recurring Reservation';
    recurringDiv.appendChild(recurringLabel);
  
    reservationForm.appendChild(recurringDiv);
  
    // Recurrence Options (hidden by default)
    const recurrenceOptionsDiv = document.createElement('div');
    recurrenceOptionsDiv.classList.add('recurrence-options', 'mb-2', 'mt-2');
    recurrenceOptionsDiv.style.display = 'none';
  
    // Frequency Select
    const frequencySelect = document.createElement('select');
    frequencySelect.classList.add('form-control', 'mb-2');
    frequencySelect.required = true;
  
    const frequencies = ['Daily', 'Weekly', 'Monthly'];
    frequencies.forEach(freq => {
      const option = document.createElement('option');
      option.value = freq.toLowerCase();
      option.textContent = freq;
      frequencySelect.appendChild(option);
    });
  
    recurrenceOptionsDiv.appendChild(frequencySelect);
  
    // End Date for Recurrence
    const recurrenceEndDate = document.createElement('input');
    recurrenceEndDate.type = 'date';
    recurrenceEndDate.classList.add('form-control', 'mb-2');
    recurrenceEndDate.required = true;
    recurrenceOptionsDiv.appendChild(recurrenceEndDate);
  
    reservationForm.appendChild(recurrenceOptionsDiv);
  
    // Event Listener to Show/Hide Recurrence Options
    recurringCheckbox.addEventListener('change', () => {
      recurrenceOptionsDiv.style.display = recurringCheckbox.checked ? 'block' : 'none';
    });
  
    // Warning Message
    const warningMsg = document.createElement('small');
    warningMsg.classList.add('form-text', 'text-danger', 'mb-2');
    warningMsg.textContent = 'مكان الاستلام و التسليم غرفة العهدة';
    reservationForm.appendChild(warningMsg);
  
    // Reserve Button
    const reserveBtn = document.createElement('button');
    reserveBtn.type = 'submit';
    reserveBtn.classList.add('btn', 'btn-primary', 'btn-block');
    reserveBtn.textContent = 'احجز الان';
    reservationForm.appendChild(reserveBtn);
  
    // Reservation Form Handler
    reservationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const quantity = parseInt(quantityInput.value);
      const recipientName = recipientNameInput.value.trim();
      const recipientMobile = recipientMobileInput.value.trim();
      const unit = unitSelect.value;
      const startTime = startTimeInput.value;
      const endTime = endTimeInput.value;
  
      const isRecurring = recurringCheckbox.checked;
      const frequency = frequencySelect.value;
      const recurrenceEnd = recurrenceEndDate.value;
  
      // Validate Inputs
      if (quantity < 1) {
        showToast('الرجاء إدخال كمية صالحة.', 'warning');
        return;
      }
  
      if (quantity > product.stock_count) {
        showToast('الكمية المطلوبة تتجاوز المخزون المتاح.', 'error');
        return;
      }
  
      if (!recipientName || !recipientMobile || !unit) {
        showToast('يرجى ملء جميع الحقول.', 'warning');
        return;
      }
  
      if (!startTime || !endTime) {
        showToast('الرجاء تحديد وقتي البدء والانتهاء.', 'warning');
        return;
      }
  
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
  
      if (isNaN(startDate) || isNaN(endDate)) {
        showToast('تنسيق التاريخ غير صالح.', 'error');
        return;
      }
  
      if (endDate <= startDate) {
        showToast('يجب أن يكون وقت الانتهاء بعد وقت البدء.', 'warning');
        return;
      }
  
      try {
        if (isRecurring) {
          if (!frequency || !recurrenceEnd) {
            showToast('الرجاء تحديد التكرار وتاريخ انتهاء التكرار.', 'warning');
            return;
          }
  
          const recurrenceEndDateObj = new Date(recurrenceEnd);
          if (isNaN(recurrenceEndDateObj)) {
            showToast('تاريخ انتهاء التكرار غير صالح.', 'error');
            return;
          }
  
          let currentStartDate = new Date(startDate);
          let currentEndDate = new Date(endDate);
  
          // Check if recurrence end date is before start date
          if (recurrenceEndDateObj < currentStartDate) {
            showToast('يجب أن يكون تاريخ انتهاء التكرار بعد تاريخ البدء.', 'warning');
            return;
          }
  
          while (currentStartDate <= recurrenceEndDateObj) {
            // Check stock availability
            const productDoc = await db.collection('products').doc(productId).get();
            const productData = productDoc.data();
            if (productData.stock_count < quantity) {
              showToast('مخزون غير كاف للحجز المتكرر على ' + currentStartDate.toLocaleDateString(), 'error');
              break;
            }
  
            // Decrease stock
            await db.collection('products').doc(productId).update({
              stock_count: firebase.firestore.FieldValue.increment(-quantity)
            });
  
            // Create reservation
            await db.collection('reservations').add({
              product_id: productId,
              user_id: auth.currentUser.uid,
              quantity: quantity,
              reservation_start: firebase.firestore.Timestamp.fromDate(new Date(currentStartDate)),
              reservation_end: firebase.firestore.Timestamp.fromDate(new Date(currentEndDate)),
              status: 'Active',
              stock_restored: false,
              recipient_name: recipientName,
              recipient_mobile: recipientMobile,
              unit: unit,
              created_at: firebase.firestore.FieldValue.serverTimestamp(),
              updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
  
            // Update currentStartDate and currentEndDate based on frequency
            if (frequency === 'daily') {
              currentStartDate.setDate(currentStartDate.getDate() + 1);
              currentEndDate.setDate(currentEndDate.getDate() + 1);
            } else if (frequency === 'weekly') {
              currentStartDate.setDate(currentStartDate.getDate() + 7);
              currentEndDate.setDate(currentEndDate.getDate() + 7);
            } else if (frequency === 'monthly') {
              currentStartDate.setMonth(currentStartDate.getMonth() + 1);
              currentEndDate.setMonth(currentEndDate.getMonth() + 1);
            }
          }
  
          showToast('تم إنشاء الحجز المتكرر بنجاح.', 'success');
        } else {
          // Decrease stock immediately
          await db.collection('products').doc(productId).update({
            stock_count: firebase.firestore.FieldValue.increment(-quantity)
          });
  
          // Create Reservation
          await db.collection('reservations').add({
            product_id: productId,
            user_id: auth.currentUser.uid,
            quantity: quantity,
            reservation_start: firebase.firestore.Timestamp.fromDate(startDate),
            reservation_end: firebase.firestore.Timestamp.fromDate(endDate),
            status: 'Active',
            stock_restored: false,
            recipient_name: recipientName,
            recipient_mobile: recipientMobile,
            unit: unit,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
          });
  
          showToast('تم إنشاء الحجز بنجاح.', 'success');
        }
  
        reservationForm.reset();
      } catch (error) {
        console.error("خطأ في إنشاء الحجز:", error);
        showToast('حدث خطأ أثناء إنشاء الحجز. يرجى المحاولة مرة أخرى.', 'error');
      }
    });
  
    cardBody.appendChild(reservationForm);
    card.appendChild(cardBody);
    col.appendChild(card);
    userProductsDiv.appendChild(col);
  }
  
  // User - Load Reservations
  function loadUserReservations() {
    if (!reservationsTableBody) return;
  
    db.collection('reservations')
      .where('user_id', '==', auth.currentUser.uid)
      .orderBy('created_at', 'desc')
      .onSnapshot(snapshot => {
        reservationsTableBody.innerHTML = '';
        snapshot.forEach(doc => {
          const reservation = doc.data();
          const tr = document.createElement('tr');
  
          // Product Name
          db.collection('products').doc(reservation.product_id).get().then(productDoc => {
            const product = productDoc.data();
            const productTd = document.createElement('td');
            productTd.textContent = product.name_en;
            tr.appendChild(productTd);
  
            // Quantity
            const qtyTd = document.createElement('td');
            qtyTd.textContent = reservation.quantity;
            tr.appendChild(qtyTd);
  
            // Recipient Name
            const recipientNameTd = document.createElement('td');
            recipientNameTd.textContent = reservation.recipient_name;
            tr.appendChild(recipientNameTd);
  
            // Recipient Mobile
            const recipientMobileTd = document.createElement('td');
            recipientMobileTd.textContent = reservation.recipient_mobile;
            tr.appendChild(recipientMobileTd);
  
            // Unit
            const unitTd = document.createElement('td');
            unitTd.textContent = reservation.unit;
            tr.appendChild(unitTd);
  
            // Reserve From
            const fromTd = document.createElement('td');
            fromTd.textContent = reservation.reservation_start.toDate().toLocaleString();
            tr.appendChild(fromTd);
  
            // Reserve Until
            const untilTd = document.createElement('td');
            untilTd.textContent = reservation.reservation_end.toDate().toLocaleString();
            tr.appendChild(untilTd);
  
            // Status
            const statusTd = document.createElement('td');
            statusTd.textContent = reservation.status;
            tr.appendChild(statusTd);
  
            // Actions
            const actionsTd = document.createElement('td');
            if (reservation.status === 'Active') {
              const cancelBtn = document.createElement('button');
              cancelBtn.textContent = 'Cancel';
              cancelBtn.classList.add('btn', 'btn-warning', 'btn-sm');
              cancelBtn.addEventListener('click', async () => {
                if (confirm('هل أنت متأكد أنك تريد إلغاء هذا الحجز؟')) {
                  try {
                    // Update reservation status to 'Cancelled' and mark stock_restored as true
                    await db.collection('reservations').doc(doc.id).update({
                      status: 'Cancelled',
                      stock_restored: true,
                      updated_at: firebase.firestore.FieldValue.serverTimestamp()
                    });
  
                    // Restore the stock
                    await db.collection('products').doc(reservation.product_id).update({
                      stock_count: firebase.firestore.FieldValue.increment(reservation.quantity)
                    });
  
                    showToast('تم إلغاء الحجز واستعادة المخزون.', 'success');
                  } catch (error) {
                    console.error("خطأ في إلغاء الحجز:", error);
                    showToast('حدث خطأ أثناء إلغاء الحجز. يرجى المحاولة مرة أخرى.', 'error');
                  }
                }
              });
              actionsTd.appendChild(cancelBtn);
            } else {
              actionsTd.textContent = '-';
            }
            tr.appendChild(actionsTd);
  
            reservationsTableBody.appendChild(tr);
          });
        });
      }, error => {
        console.error("خطأ في تحميل حجوزات المستخدم:", error);
      });
  }
  
  // Super Admin - Load All Reservations for Approval
  function loadAllReservations() {
    if (!reservationsApprovalTableBody) return;
  
    db.collection('reservations')
      .where('status', '==', 'Active')
      .orderBy('created_at', 'desc')
      .onSnapshot(snapshot => {
        reservationsApprovalTableBody.innerHTML = '';
        snapshot.forEach(doc => {
          const reservation = doc.data();
          const tr = document.createElement('tr');
  
          // User Email
          db.collection('users').doc(reservation.user_id).get().then(userDoc => {
            const user = userDoc.data();
            const userTd = document.createElement('td');
            userTd.textContent = user.email;
            tr.appendChild(userTd);
  
            // Product Name
            db.collection('products').doc(reservation.product_id).get().then(productDoc => {
              const product = productDoc.data();
              const productTd = document.createElement('td');
              productTd.textContent = product.name_en;
              tr.appendChild(productTd);
  
              // Quantity
              const qtyTd = document.createElement('td');
              qtyTd.textContent = reservation.quantity;
              tr.appendChild(qtyTd);
  
              // Reserve From
              const fromTd = document.createElement('td');
              fromTd.textContent = reservation.reservation_start.toDate().toLocaleString();
              tr.appendChild(fromTd);
  
              // Reserve Until
              const untilTd = document.createElement('td');
              untilTd.textContent = reservation.reservation_end.toDate().toLocaleString();
              tr.appendChild(untilTd);
  
              // Status
              const statusTd = document.createElement('td');
              statusTd.textContent = reservation.status;
              tr.appendChild(statusTd);
  
              // Actions
              const actionsTd = document.createElement('td');
              if (reservation.status === 'Active') {
                const approveBtn = document.createElement('button');
                approveBtn.textContent = 'Approve';
                approveBtn.classList.add('btn', 'btn-success', 'btn-sm', 'mr-2');
                approveBtn.addEventListener('click', async () => {
                  try {
                    await db.collection('reservations').doc(doc.id).update({
                      status: 'Approved',
                      updated_at: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    showToast('تمت الموافقة على الحجز.', 'success');
                  } catch (error) {
                    console.error("خطأ في الموافقة على الحجز:", error);
                    showToast('خطأ في الموافقة على الحجز. يرجى المحاولة مرة أخرى.', 'error');
                  }
                });
                actionsTd.appendChild(approveBtn);
  
                const declineBtn = document.createElement('button');
                declineBtn.textContent = 'Decline';
                declineBtn.classList.add('btn', 'btn-danger', 'btn-sm');
                declineBtn.addEventListener('click', async () => {
                  if (confirm('هل أنت متأكد أنك تريد رفض هذا الحجز؟')) {
                    try {
                      // Update reservation status to 'Declined' and mark stock_restored as true
                      await db.collection('reservations').doc(doc.id).update({
                        status: 'Declined',
                        stock_restored: true,
                        updated_at: firebase.firestore.FieldValue.serverTimestamp()
                      });
  
                      // Restore the stock
                      await db.collection('products').doc(reservation.product_id).update({
                        stock_count: firebase.firestore.FieldValue.increment(reservation.quantity)
                      });
  
                      showToast('تم رفض الحجز واستعادة المخزون.', 'success');
                    } catch (error) {
                      console.error("خطأ في رفض الحجز:", error);
                      showToast('حدث خطأ أثناء رفض الحجز. يرجى المحاولة مرة أخرى.', 'error');
                    }
                  }
                });
                actionsTd.appendChild(declineBtn);
              } else {
                actionsTd.textContent = '-';
              }
              tr.appendChild(actionsTd);
  
              reservationsApprovalTableBody.appendChild(tr);
            });
          });
        });
      }, error => {
        console.error("خطأ في تحميل جميع الحجوزات للموافقة عليها:", error);
      });
  }
  
  // Create User Modal - Open Modal
  if (createUserBtn && createUserModal) {
    createUserBtn.addEventListener('click', () => {
      createUserModal.style.display = 'block';
    });
  }
  
  // Create User Modal - Close Modal
  window.addEventListener('click', (event) => {
    if (event.target == createUserModal) {
      createUserModal.style.display = 'none';
    }
    if (event.target == createRoleModal) {
      createRoleModal.style.display = 'none';
    }
    if (event.target == editProductModal) {
      editProductModal.style.display = 'none';
    }
  });
  
  // Admin - Create New User
  if (createUserForm) {
    createUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = newUserEmail.value.trim();
      const password = newUserPassword.value;
      const role = newUserRole.value;
  
      if (!email || !password || !role) {
        showToast('يرجى ملء جميع الحقول.', 'warning');
        return;
      }
  
      try {
        // Create User with Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
  
        // Assign Role in Firestore
        await db.collection('users').doc(user.uid).set({
          email: email,
          role: role,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        showToast('تم إنشاء المستخدم بنجاح.', 'success');
        createUserForm.reset();
        createUserModal.style.display = 'none';
        loadRoles(); // Refresh roles if necessary
      } catch (error) {
        console.error("خطأ في إنشاء المستخدم:", error);
        showToast(error.message, 'error');
      }
    });
  }
  
  // Create Role Modal - Open Modal
  if (createRoleBtn && createRoleModal) {
    createRoleBtn.addEventListener('click', () => {
      createRoleModal.style.display = 'block';
    });
  }
  
  // Admin - Create New Role
  if (createRoleForm) {
    createRoleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roleName = newRoleName.value.trim();
  
      if (!roleName) {
        showToast('الرجاء إدخال اسم الدور.', 'warning');
        return;
      }
  
      try {
        // Add new role to 'roles' collection
        await db.collection('roles').add({
          role_name: roleName,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
  
        showToast('تم إنشاء الدور بنجاح.', 'success');
        createRoleForm.reset();
        createRoleModal.style.display = 'none';
        loadRoles(); // Refresh roles
      } catch (error) {
        console.error("خطأ في إنشاء الدور:", error);
        showToast('حدث خطأ أثناء إنشاء الدور. يرجى المحاولة مرة أخرى.', 'error');
      }
    });
  }
  
  // Load Roles into Create User Form
  function loadRoles() {
    if (!newUserRole) return;
  
    db.collection('roles').orderBy('created_at').get().then(snapshot => {
      newUserRole.innerHTML = ''; // Clear existing options
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select Role';
      newUserRole.appendChild(defaultOption);
  
      snapshot.forEach(doc => {
        const role = doc.data();
        const option = document.createElement('option');
        option.value = role.role_name;
        option.textContent = role.role_name;
        newUserRole.appendChild(option);
      });
    }).catch(error => {
      console.error("خطأ في تحميل الأدوار:", error);
    });
  }
  
  // Admin - Switch to User Mode
  if (switchUserModeBtn) {
    switchUserModeBtn.addEventListener('click', () => {
      showToast('التبديل إلى وضع المستخدم.', 'info');
      showUserSection();
    });
  }
  
  // Live Search Functionality
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      loadUserProducts(query);
    });
  }
  
  // Reset Search Functionality
  if (resetSearchBtn) {
    resetSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      loadUserProducts();
    });
  }
  
  // Client-Side Automatic Stock Restoration
  function automaticStockRestoration() {
    const now = firebase.firestore.Timestamp.now();
  
    db.collection('reservations')
      .where('reservation_end', '<=', now)
      .where('stock_restored', '==', false)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.log('لا توجد تحفظات لاستعادة المخزون.');
          return;
        }
  
        const batch = db.batch();
  
        snapshot.forEach(doc => {
          const reservation = doc.data();
          const productRef = db.collection('products').doc(reservation.product_id);
  
          // Restore the stock
          batch.update(productRef, {
            stock_count: firebase.firestore.FieldValue.increment(reservation.quantity)
          });
  
          // Update reservation status and flag
          batch.update(doc.ref, {
            stock_restored: true,
            status: 'Completed',
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
  
        return batch.commit();
      })
      .then(() => {
        console.log('اكتملت عملية استعادة المخزون.');
      })
      .catch(error => {
        console.error('خطأ في استعادة المخزون:', error);
      });
  }
  
  // Run the restoration check every minute
  setInterval(automaticStockRestoration, 60 * 1000);
  
  // Handle Automatic Stock Restoration on Page Load
  window.addEventListener('load', () => {
    automaticStockRestoration();
  });
  
  // Close Modals on Escape Key Press
  document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
      if (createUserModal) createUserModal.style.display = 'none';
      if (createRoleModal) createRoleModal.style.display = 'none';
      if (editProductModal) editProductModal.style.display = 'none';
    }
  });
  