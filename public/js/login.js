const inputs = document.querySelectorAll(".input-field");
const toggle_btn = document.querySelectorAll(".toggle");
const main = document.querySelector("main");
const bullets = document.querySelectorAll(".bullets span");
const signBtn = document.querySelectorAll(".sign-btn");
const backButton = document.querySelector(".back_button");
const images = document.querySelectorAll(".image");

inputs.forEach((inp) => {
  inp.addEventListener("focus", () => {
    inp.classList.add("active");
  });
  inp.addEventListener("blur", () => {
    if (inp.value != "") return;
    inp.classList.remove("active");
  });
});

toggle_btn.forEach((btn) => {
  btn.addEventListener("click", () => {
    main.classList.toggle("sign-up-mode");
    if(main.classList.contains("sign-up-mode")){
      main.style.backgroundColor = "#453c5c";
      signBtn[1].style.backgroundColor = "#ff6b6b";
    } else {
      main.style.backgroundColor = "#ff6b6b";
      signBtn[0].style.backgroundColor = "#453c5c";
    }
  });
});

$(document).ready(function () {
  console.log($('#is_signup').val());
  console.log($('#is_signup').val() == 'true');
  if($('#is_signup').val() == 'true') {
    main.classList.toggle("sign-up-mode");
    if(main.classList.contains("sign-up-mode")){
      main.style.backgroundColor = "#453c5c";
      signBtn[1].style.backgroundColor = "#ff6b6b";
    } else {
      main.style.backgroundColor = "#ff6b6b";
      signBtn[0].style.backgroundColor = "#453c5c";
    }
  }
})

function moveSlider() {
  let index = this.dataset.value;
  let currentImage = document.querySelector(`.img-${index}`);
  images.forEach((img) => img.classList.remove("show"));
  currentImage.classList.add("show");

  bullets.forEach((bull) => bull.classList.remove("active"));
  this.classList.add("active");
}

bullets.forEach((bullet) => {
  bullet.addEventListener("click", moveSlider);
});

$('#sign-up').click(() => {
  let username = $('#username').val();
  let password = $('#password').val();
  // postData("/signup", {email, password})

  // const response = fetch('/login', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     username,
  //     password
  //   })
  // });

});
