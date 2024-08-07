function  copyMenu() {
    let dptCategory = document.querySelector('.dpt-cat');
    let dptPlace =  document.querySelector('.departments');
    dptPlace.innerHTML = dptCategory.innerHTML;

    let mainNav = document.querySelector('.header-nav nav');
    let navPlace = document.querySelector('.off-canvas nav');
    navPlace.innerHTML = mainNav.innerHTML;

    let topNav = document.querySelector('.header-top .wrapper');
    let topPlace = document.querySelector('.off-canvas .thetop-nav');
    topPlace.innerHTML = topNav.innerHTML;

}
copyMenu();

$('.hoverable').on('click', 'li', function() {
    const isAuthenticated = document.getElementById('isAuthenticated').value;
    if(isAuthenticated){
        $(this).toggleClass('favorite');
        let isFavorite = $(this).hasClass('favorite');
        let count = isFavorite ? +$('.count-of-favorite').text() + 1 : +$('.count-of-favorite').text() - 1;
        $('.count-of-favorite').text(count);
        let productId = $(this).closest('.hoverable').find('.product-id').val();
        const csrf = document.getElementById('user_csrf').value;
        const formData = {
            isFavorite,
            productId
        };
        fetch('/favorite-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'csrf-token': csrf
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                console.log('Data sent successfully');
            })
            .catch(error => {
                console.error('Error:', error);
            });
     } else {
        window.location.href = "/login";
    }
});

const menuButton = document.querySelector('.trigger'),
    closeButton = document.querySelector('.t-close'),
    addclass = document.querySelector('.site');

menuButton.addEventListener('click', function () {
    addclass.classList.toggle('showmenu')
})
closeButton.addEventListener('click', function () {
    addclass.classList.remove('showmenu')
})

closeButton.addEventListener('click', function () {
    addclass.classList.remove('showmenu')
})

const submenu = document.querySelectorAll('.has-child .icon-small');
submenu.forEach((menu) => menu.addEventListener('click', toggle));

function toggle(e) {
    e.preventDefault();
    submenu.forEach((item) => item != this ? item.closest('.has-child').classList.remove('expand') : null);
    if(this.closest('.has-child').classList != 'expand');
    this.closest('.has-child').classList.toggle('expand')
}

const swiper = new Swiper('.swiper', {
    loop: true,

    pagination: {
        el: '.swiper-pagination',
    },
    autoplay: {
        delay: 3000,
    },

});

const searchButton = document.querySelector('.t-search'),
    tClose = document.querySelector('.search-close'),
    showClass = document.querySelector('.site');
searchButton.addEventListener('click', function () {
    showClass.classList.toggle('showsearch')
})

tClose.addEventListener('click', function () {
    showClass.classList.remove('showsearch')
})

const dptButton = document.querySelector('.dpt-cat .dpt-trigger'),
    dptClass = document.querySelector('.site');
dptButton.addEventListener('click', function () {
    dptClass.classList.toggle('showdpt');
})

var productThumb = new Swiper ('.small-image', {
    loop: true,
    spaceBetween: 10,
    slidesPerView: 3,
    freeMode: true,
    watchSlidesProgress: true,
    breakpoints: {
        401: {
            spaceBetween: 32,
        }
    }
});

var productBig = new Swiper ('.big-image', {
    loop:true,
    autoHeight:true,
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    thumbs: {
        swiper: productThumb,
    }
})

//stock products bar width percentage
let stocks = document.querySelectorAll('.products .stock');
for (let x=0; x<stocks.length; x++) {
    let stock = stocks[x].dataset.stock,
        available = stocks[x].querySelector('.qty-available').innerHTML,
        sold = stocks[x].querySelector('.qty-sold').innerHTML,
        percent = sold*100/stock;
    stocks[x].querySelector('.available').style.width = percent + '%';
}

//show cart on click
//show cart on click
const divtoShow = '.mini-cart';
const divPopup = document.querySelector(divtoShow);
const divTrigger = document.querySelector('.cart-trigger');

divTrigger.addEventListener('click', () => {
    setTimeout(() => {
        if(!divPopup.classList.contains('show')) {
            divPopup.classList.add('show');
        }
    }, 250)
})
//
// close by click outside
document.addEventListener('click', (e) => {
    const isClosest = e.target.closest(divtoShow);
    if(!isClosest && divPopup.classList.contains('show')) {
        divPopup.classList.remove('show')
    }
})

$(".rating-stars").click(function (e) {
    e.preventDefault();
    if ($(".rating-stars :radio:checked").length == 0) {
        $('#status').html("nothing checked");
        return false;
    } else {
        $('#status').html( 'You picked ' + $('input:radio[name=rating]:checked').val() );
    }
});


