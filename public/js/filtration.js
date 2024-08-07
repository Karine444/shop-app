$('input[name="checkbox"]').on('click', function() {
    let selectedSubcategories = [];
    $('input[name="checkbox"]:checked').each(function() {
        selectedSubcategories.push($(this).val());
    });
    $(".search input[name='search']").val('');
    window.history.pushState(null, null, `?subcategory=${encodeURIComponent(selectedSubcategories.join(','))}`);
    $.ajax({
        type: 'GET',
        url: '/filter-products',
        data: { subcategories: selectedSubcategories },
        success: function(products) {
            let productsHTML = '';
            products.forEach(function(product) {
                productsHTML += `
                <div class="item">
                    <div class="media">
                        <div class="thumbnail object-cover">
                            <a href="/page-offer/${product._id}">
                                <img src="${product.image}" alt="">
                            </a>
                        </div>
                        <div class="hoverable">
                            <ul>
                                <input type="hidden" class="product-id" value="${product._id}"/>
                                <li class="active ${product.isFavorite ? 'favorite' : ''}"><div class="circle-for"><i class="ri-heart-line"></i></div></li>
                            </ul>
                        </div>
                        <div class="discount circle flexcenter"><span>${product.discount}%</span></div>
                    </div>
                    <div class="content">
                        <h3 class="main-links"><a href="/page-offer/${product._id}" >${product.title}</a></h3>
                        <div class="rating">
                            <div class="stars"></div>
                            <span class="mini-text">(${product.numReviews})</span>
                        </div>
                        <div class="price">
                            <span class="current">$${product.price}</span>
                        </div>
                        <div class="mini-text">
                            <p>${product.stock} sold</p>
                            <p>Անվճար առաքում</p>
                        </div>
                    </div>
                </div>
            `;
            });
            console.log(productsHTML);
            $('#products-list').html(productsHTML);
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
        }
    });

});