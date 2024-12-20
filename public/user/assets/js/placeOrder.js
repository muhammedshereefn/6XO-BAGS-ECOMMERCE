document.getElementById('placeOrderButton').addEventListener('click', async () => {
  const selectedAddressId = document.querySelector('input[name="selectedAddressId"]:checked').value;
  const paymentMethod = document.querySelector('input[name="payment_option"]:checked').value;
  const total = document.getElementById('orderTotalInput').value;
  const totalElement = document.querySelector('.font-xl.text-brand.fw-900');
const discountedTotal = totalElement.textContent.replace('₹', ''); // Extract value without currency symbol





  const payload = {
    selectedAddressId,
    paymentMethod,
    total: discountedTotal || total,
  };

  try {
    if (paymentMethod === 'cod') {
      const response = await fetch('/placeOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }, 
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // alert('COD successful');
        console.log('Order placed successfully!');
       
      } else {
        console.error('Failed to place order');
      }

    } else if (paymentMethod === 'razorpay') {
      

      const response = await fetch('/placeOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        console.log("FIRST ORDER RESPONSE OK ANN",response);
        
        response.json().then((res)=>{
          var options = {
            "key": "rzp_live_Yns1JlyDs6fTuK",
            "amount": res.order.amount,
            "currency": res.order.currency,
            "name": "6XO BAGS",
            "description": "Test Transaction",
            "image": "/Images/6XOLOGO.png",
            "order_id": res.order.id, 
            "handler": async function (response) {

              const updatedPayload = {
                ...payload,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }
  
              // Fetch to complete the order on the server
              await fetch('/placeOrderRaz', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedPayload),
              });
  
              console.log("Front end ok oredered this is payload",payload);
              
              window.location.href = '/orders';
            }
          };
        
          var rzp1 = new Razorpay(options);
          rzp1.open();
        })

       

       
      }else if (response.status === 400) {
        // Show error message for invalid stock
        const res = await response.json();
        Swal.fire('Error', res.message, 'error');
      }
    }else if (paymentMethod === 'wallet') {
      const response = await fetch('/placeOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200) {
        // Wallet payment successful
        const confirmResult = await Swal.fire({
          title: 'Order Placed Successfully',
          text: 'Do you want to view your orders?',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Yes, view orders',
          cancelButtonText: 'No, thanks'
      });

      if (confirmResult.isConfirmed) {
          window.location.href = '/orders'; // Redirect after user confirms
      } else {
          // Handle if the user clicks "No"
          console.log('User chose not to view orders');
      }
      } else if (response.status === 501) {
        // Insufficient wallet balance
        console.error('Insufficient wallet balance');
        Swal.fire('Error', 'Insufficient wallet balance.', 'error');
      } else {
        // Handle other cases if needed
        console.error('Failed to place order using wallet');
        Swal.fire('Error', 'Failed to place order using wallet.', 'error');
      }
    }

  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Error', 'An error occurred while processing the order.', 'error');
  }
});

  


function confirmPlaceOrder() {
  const selectedAddressId = document.querySelector('input[name="selectedAddressId"]:checked');
  const paymentMethod = document.querySelector('input[name="payment_option"]:checked');

  if (!selectedAddressId || !paymentMethod) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please select an address and payment method!',
    });
    return;
  }

  if (paymentMethod.value === 'cod') {
    // Display SweetAlert only for "cod" payment method
    Swal.fire({
      icon: 'question',
      title: 'Confirm Order',
      text: 'Are you sure you want to place this order?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        // User clicked "Yes," proceed with order confirmation
        Swal.fire({
          icon: 'success',
          title: 'Order Confirmed!',
          text: 'Your order has been successfully placed.',
        }).then(() => {
          // Redirect to the order details page
         
          window.location.href = '/orders';
        });
      } else {
        // User clicked "No" or closed the confirmation prompt
        Swal.fire({
          icon: 'info',
          title: 'Order Not Confirmed',
          text: 'Your order has not been placed.',
        });
      }
    });
  } else {
    // For non-"cod" payment methods, proceed with the order without displaying SweetAlert
    placeOrder(selectedAddressId.value, paymentMethod.value);
  }
}
