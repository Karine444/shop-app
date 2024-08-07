$(".rate-this label").click(function () {
    let clickedId = $(this).attr('for');
    let rating = clickedId.replace('star', '');
    $('#comment-rate').val(rating);
});

$('.review-block-body .item').each(function() {
    let rating = parseInt($(this).find('.comment-rating').val());
    let starsContainer = $(this).find('.review-rating .stars');
    starsContainer.empty();
    for (let i = 0; i < rating; i++) {
        let star = $('<div>').addClass('star filled');
        starsContainer.append(star);
    }
    for (let i = rating; i < 5; i++) {
        let emptyStar = $('<div>').addClass('star empty');
        starsContainer.append(emptyStar);
    }
});
