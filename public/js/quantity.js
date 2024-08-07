$(document).ready(function() {
    $('.plus').on('click', function() {
        let currentValue = parseInt($('.quantity-input').val());
        currentValue = currentValue + 1;
        $('.quantity-input').val(currentValue);
        $('#quantity').val(currentValue);
    });

    $('.minus').on('click', function() {
        let currentValue = parseInt($('.quantity-input').val());
        if (currentValue > 1) {
            currentValue = currentValue - 1;
            $('.quantity-input').val(currentValue);
            $('#quantity').val(currentValue);
        }
    });
});

$(".size-input").click(function () {
    let radioButtonId = $(this).attr('id');
    let sizeNumber = radioButtonId.split('-')[1];
    $('#size').val(sizeNumber);
})