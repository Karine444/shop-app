document.getElementById('order-btn').addEventListener('click', function(event) {
    event.preventDefault();
    const csrf = document.getElementById('csrf').value;
    const formData = {
        fname: document.getElementById('fname').value,
        lname: document.getElementById('lname').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        postal: document.getElementById('postal').value,
        country: document.getElementById('country').value,
        phone: document.getElementById('phone').value,
        notes: document.querySelector('textarea').value,
        amount: document.getElementById('totalAmount').value
    };

    fetch('/checkout/storeData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'csrf-token': csrf
        },
        body: JSON.stringify(formData) // Convert the data to JSON format
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the JSON response
        })
        .then(data => {
            console.log(data); // Do something with the response data
        })
        .catch(error => {
            console.error('There was a problem with your fetch operation:', error);
        });
});
