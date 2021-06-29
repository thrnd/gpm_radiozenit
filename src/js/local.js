document.addEventListener("click", (event) => {
    const playBtn = event.target.closest(".play-btn");

    if (playBtn === null ) return;

    playBtn.classList.toggle("pause");
    // playBtn.classList.toggle("play");
});

var MP = {
    ParseQueryString(url) {
        return {
            an: "about-us"
        };
    }
}