
const discountContainer = document.querySelector(".discount-container");

const days = document.querySelector(".countdown-timer .timer_0");
const hours = document.querySelector(".countdown-timer .timer_1");
const minutes = document.querySelector(".countdown-timer .timer_2");
const seconds = document.querySelector(".countdown-timer .timer_3");
const date = $('.countdownDate').val();
const countdownDate = new Date(date).getTime();

let timer = setInterval(() => {
    let now = new Date().getTime();
    let distance = countdownDate - now;

    let daysValue = Math.floor(distance / (1000 * 60 * 60 * 24))
        .toString()
        .padStart(2, "0");
    let hoursValue = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )
        .toString()
        .padStart(2, "0");
    let minutesValue = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, "0");
    let secondsValue = Math.floor((distance % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, "0");
    days.innerHTML = daysValue;
    hours.innerHTML = hoursValue;
    minutes.innerHTML = minutesValue;
    seconds.innerHTML = secondsValue;

    if (distance < 0) {
        clearInterval(t);
        discountContainer.style.display = "none";
    }
}, 1000);
