


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

    const orderResponse = await fetch('/createProductOrder',{
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (orderResponse.status === 400) {
      const errorResponse = await orderResponse.json();
      Swal.fire({
        icon: 'error',
        title: 'Out of Stock',
        text: errorResponse.error,
        confirmButtonText: 'Go to Cart',
        confirmButtonColor: '#3085d6',
        preConfirm: () => {
          window.location.href = '/cart';  // Redirect to home page
        },
      });
      return;
    }

    if (orderResponse.status === 201) {
      const { productOrderId } = await orderResponse.json();
   

    if (paymentMethod === 'razorpay') {

      const response = await fetch('/placeOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productOrderId, total: discountedTotal }),
      });

      if (response.status === 201) {
        
        const { order } = await response.json();
        
        const options = {
          key : "rzp_test_Vz3Fdh1bVQWYj8",
          amount : order.amount,
          currency: order.currency,
          name: '6XO BAGS',
          description: 'Test Transaction',
          image: '/Images/6XOLOGO.png',
          order_id: order.id,

          handler: async (response) => {
            const updatedPayload = {
              ...payload,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              productOrderId
            };

            document.getElementById('loadingSpinner').style.display = 'flex';

            const placeOrderResponse = await fetch('/placeOrderRaz',{
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedPayload),
            });
            if (placeOrderResponse.status === 201) {
              // alert('Order placed successfully!');
              window.location.href = '/orders';
            } else {
              alert('Order failed. Payment refunded.');
              document.getElementById('loadingSpinner').style.display = 'none'; 
            }
          },

          modal : {
            ondismiss: async () => {
              // Send request to delete the order if Razorpay modal is closed
              const orderId = productOrderId;
              console.log(orderId);
              
              await fetch('/deleteOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                
                body: JSON.stringify({ orderId })
              });
              console.log('Order deleted due to Razorpay modal close');
              
            }
          }
        }

        const rzp = new Razorpay(options);
        rzp.open();
        
       
      }
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
   else {
    // For non-"cod" payment methods, proceed with the order without displaying SweetAlert
    placeOrder(selectedAddressId.value, paymentMethod.value);
  }
}
