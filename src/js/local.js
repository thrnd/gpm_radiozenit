document.addEventListener("click", (event) => {
    const playBtn = event.target.closest(".play-btn");

    if (playBtn === null ) return;

    playBtn.classList.toggle("pause");
    // playBtn.classList.toggle("play");
});

document.addEventListener("keydown", (event) => {
    if (event.code !== "KeyL") return;

    document.documentElement.classList.toggle("light-theme");
});

var MP = {
    ParseQueryString(url) {
        const page = window.location.pathname
            .replace("/", "")
            .replace(".html", "");

        return {
            an: page
        };
    }
}

var History = { Adapter() {} };