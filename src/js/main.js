var RadioZenit = RadioZenit || {
    // названия статей в шаблонизаторе
    indexPageAn:    "index",
    programPageAn:  "program",
    aboutPageAn:    "about",
};

RadioZenit.resizeHandlers = RadioZenit.resizeHandlers || {};
RadioZenit.initializers = RadioZenit.initializers || {};
RadioZenit.initedPages = RadioZenit.initedPages || {};

// инициализация общих для всего сайта обработчиков
RadioZenit.initCommon = () => {
    if (RadioZenit.isInited) return;

    isDocReady(() => {
        const { documentElement: root, body } = document;
        let viewportWidth = body.clientWidth;
        let isMenuOpened = false;

        const menu = document.querySelector(".menu-wrap");
        const menuParent = menu.closest(".page-header__menu");

        // при клике на пункт меню в мобильном разрешении нужно закрыть меню
        // ловим на фазе погружения, потому что в противном случае событие не срабатывает
        // видимо, какой-то конфликт с либой MPAjax
        document.addEventListener("click", (event) => {
            const menuLink = event.target.closest(".menu__link");

            if (viewportWidth > 991 || menuLink === null) return;

            toggleMenu(false);
        }, true);

        // по умолчанию меню скрыто через display: none
        // для анимации нужно сначала его показать через display: block/flex
        // а затем запустить анимацию появления
        const MENU_VISIBLE_CLASSNAME =      "menu-wrap_visible";
        const MENU_ANIMATION_CLASSNAME =    "menu-wrap_appeared";

        const callUsBtn = document.querySelector(".call-us-btn");
        const toggleThemeBtn = document.querySelector(".toggle-theme-btn");

        // показать/скрыть меню
        const toggleMenuBtn = document.querySelector(".toggle-menu-btn");

        toggleMenuBtn.addEventListener("click", (event) => {
            // если есть класс анимации, значит меню
            // либо в процессе анимации (появления)
            // либо анимация появления уже проиграла и оно просто открыто
            // соответственно, если класса нет, то
            // либо проигрывается анимация скрытия
            // либо меню скрыто совсем через display: none
            const isMenuAppeared = menu.classList.contains(MENU_ANIMATION_CLASSNAME);

            toggleMenu(!isMenuAppeared);
        });
        
        function toggleMenu(show) {
            isMenuOpened = show;

            toggleAnimation({
                show,
                el: menu,
                visibleClass: MENU_VISIBLE_CLASSNAME,
                animationClass: MENU_ANIMATION_CLASSNAME,
                onStateToggle: (show) => {
                    toggleBodyScrolling(show);

                    menuParent.classList.toggle("page-header__menu_menu-opened", show);

                    // при открытии меню кнопка звонка в эфир меняется на кнопку смены темы
                    callUsBtn.classList.toggle("page-header__btn_hidden", show);
                    toggleThemeBtn.classList.toggle("page-header__btn_hidden", !show);

                    toggleMenuBtn.classList.toggle("toggle-menu-btn_active", show);
                    toggleMenuBtn.setAttribute("aria-label", show ? "Закрыть меню" : "Открыть меню");
                },
                onBeforeShowing: () => {
                    menu.scrollTop = 0;
                },
            });
        }

        const playlist = document.querySelector(".main-playlist-wrap");
        const playlistInner = playlist.querySelector(".main-playlist-wrap__inner");
        const togglePlaylistBtn = document.querySelector(".main-player__expand-btn");

        // по умолчанию плейлист скрыт через display: none
        // для анимации нужно сначала его показать через display: block/flex
        // а затем запустить анимацию появления
        const PLAYLIST_VISIBLE_CLASSNAME =      "main-playlist-wrap_visible";
        const PLAYLIST_ANIMATION_CLASSNAME =    "main-playlist-wrap_appeared";

        const header = document.querySelector(".page-header");
        setHeaderHeight();

        // скрываем меню при переходе
        const menuLinks = [...document.querySelectorAll(`.menu__link`)];
        menuLinks.forEach((link) => {
            link.addEventListener(`click`, () => {
                const isPlaylistOpened = playlist.classList.contains(PLAYLIST_ANIMATION_CLASSNAME);
                if (isPlaylistOpened) togglePlaylist(!isPlaylistOpened);
            });
        });

        // показать/скрыть плейлист плеера
        document.addEventListener("click", (event) => {
            const { target } = event;
            
            // проверяем - если это прогресс-бар то выходим
            if (
                target.classList.contains(`progress-bar`) || 
                target.classList.contains(`progress-bar__back`)
            ) return false;
            
            const isTogglePlaylistBtn = target === togglePlaylistBtn;
            const isPlayerText = target.closest(".main-player__inner") !== null;

            if (!isTogglePlaylistBtn && !isPlayerText) return;

            // если есть класс анимации, значит плейлист
            // либо в процессе анимации (появления)
            // либо анимация появления уже проиграла и он просто открыт
            // соответственно, если класса нет, то
            // либо проигрывается анимация скрытия
            // либо плейлист скрыт совсем через display: none
            const isPlaylistOpened = playlist.classList.contains(PLAYLIST_ANIMATION_CLASSNAME);

            togglePlaylist(!isPlaylistOpened);
        });

        // если клик произошел по затененной области открытого плейлиста - скрываем его
        document.addEventListener("click", (event) => {
            const { target } = event;
            const playlistContainer = target.classList.contains("main-playlist-wrap__outer");

            if (!playlistContainer && target !== playlist) return;

            togglePlaylist(false);
        });

        function togglePlaylist(show) {
            toggleAnimation({
                show,
                el: playlist,
                visibleClass: PLAYLIST_VISIBLE_CLASSNAME,
                animationClass: PLAYLIST_ANIMATION_CLASSNAME,
                onStateToggle: (show) => {
                    toggleBodyScrolling(show);

                    togglePlaylistBtn.classList.toggle("main-player__expand-btn_expanded", show);
                    togglePlaylistBtn.setAttribute("aria-label", show ? "Скрыть плейлист" : "Показать плейлист");
                },
                onBeforeShowing: () => {
                    playlistInner.scrollTop = 0;
                },
            });
        }

        // при открытии попапцев убираем возможность скролла на body
        function toggleBodyScrolling(isPopupVisible) {
            const paddingRight = isPopupVisible ? `${getScrollbarWidth()}px` : "";
            const overflow = isPopupVisible ? "hidden" : "";

            body.style.paddingRight = paddingRight;
            body.style.overflow = overflow;
        }

        // при ресайзе на десктопные ширины, скрываем меню
        window.addEventListener("resize", throttle(function() {
            viewportWidth = body.clientWidth;

            if (viewportWidth > 991 && isMenuOpened) {
                setHeaderHeight();
                toggleMenu(false);
            }
        }, window, 200));

        // перерасчет высоты хедера
        // нужно для позиционирования плейлиста
        function setHeaderHeight() {
            playlist.style.setProperty("--default-header-height", viewportWidth > 991 ? `${header.offsetHeight}px` : "");
        }

        // переключение темы
        toggleThemeBtn.addEventListener("click", (event) => {
            toggleThemeBtn.classList.toggle("toggle-theme-btn_state_light");
            root.classList.toggle("light-theme");

            const isLightTheme = root.classList.contains("light-theme");

            document.cookie = `tpl_theme=light${isLightTheme ? "" : "; max-age=0"}`;
            toggleThemeBtn.setAttribute("aria-label", `Переключиться на ${isLightTheme ? "темную" : "светлую"} тему`);
        });

        // при запуске подкаста, нужно заменить всплывающий плейлист
        // с истории эфира на список подкастов

        // на каждой кнопке .js-podcast-play должны быть следующие атрибуты:
        // data-program -       id программы, к которой относится подкаст
        // data-podcast-title - имя подкаста для подстановки его в главный плеер при запуске
        document.addEventListener("click", (event) => {
            const playPodcastBtn = event.target.closest(".js-podcast-play");

            if (playPodcastBtn === null) return;
            
            toggleBackToRadioBtn(true);

            // выделяем плеер с подкастом (на странице программы), который мы запустили
            const podcastPlayer = playPodcastBtn.closest(".player_view_podcast");

            if (podcastPlayer !== null) {
                [ ...document.querySelectorAll(".player_podcast-playing") ].forEach(player => {
                    player.classList.remove("player_podcast-playing");
                });
                // даже если подкаст поставлен на паузу, оставляем его выделенным
                podcastPlayer.classList.add("player_podcast-playing");
            }

            // хотим запустить/запаузить подкаст какой программы?
            const targetProgramID = +playPodcastBtn.dataset.program;

            // меняем название проигрываемого в данный момент источника
            [ ...document.querySelectorAll(".main-player__text-line") ].forEach(line => {
                if (line.id !== "js-podcast-titles") return line.style.display = "none";

                line.style.display = "";
                line.title = playPodcastBtn.dataset.podcastTitle;
                line
                    .querySelector(".main-player__text_t_title")
                    .textContent = playPodcastBtn.dataset.podcastTitle;
                line
                    .querySelector(".main-player__text:not(.main-player__text_t_title)")
                    .tectContent = "";
            });

            // если мы кликнули по кнопке play/pause подкаста, который уже играет,
            // то не меняем ничего
            if (targetProgramID === RadioZenit.currentlyPlayingProgramID) return;

            // ------------------------------------------------------------
            // далее по коду: подмена плейлиста эфира на плейлист программы
            // ------------------------------------------------------------

            // ищем на странице скрытый элемент с заранее построенным плейлистом
            // для замены всплывающего плейлиста
            const podcastPlaylistContent = document.getElementById("js-program-playlist");

            if (podcastPlaylistContent === null) {
                console.error("Блок #js-program-playlist не найден, не могу заменить плейлист");
                return;
            }

            RadioZenit.currentlyPlayingProgramID = targetProgramID;

            // если удалить историю эфира из дома и строить заново
            // к ней не подключатся титры
            // поэтому просто скрываем ее
            const mainPlaylist = document.getElementById("js-main-playlist");
            const podcastPlaylist = document.getElementById("js-podcast-playlist");

            podcastPlaylist.innerHTML = "";
            podcastPlaylist.innerHTML = podcastPlaylistContent.innerHTML;
            podcastPlaylist.style.display = "";
            mainPlaylist.style.display = "none";

            setTitlesTicker();
        });
        
        // при воспроизведении сэмпла песни из истории эфира
        // показываем кнопку "обратно к эфиру"

        // на каждой кнопке .js-sample-btn должны быть следующие атрибуты:
        // data-track-title -   название исполнителя
        // data-track-name -    название трека (может быть пустым)
        document.addEventListener("click", (event) => {
            const sampleBtn = event.target.closest(".js-sample-btn");

            if (sampleBtn === null) return;

            toggleBackToRadioBtn(true);

            // меняем название проигрываемого в данный момент источника
            [ ...document.querySelectorAll(".main-player__text-line") ].forEach(line => {
                if (line.id !== "js-podcast-titles") return line.style.display = "none";

                line.style.display = "";
                line.title = sampleBtn.dataset.trackTitle;
                line
                    .querySelector(".main-player__text_t_title")
                    .textContent = sampleBtn.dataset.trackTitle;

                const { trackName } = sampleBtn.dataset;

                line
                    .querySelector(".main-player__text:not(.main-player__text_t_title)")
                    .textContent = `${trackName ? ` - ${trackName}` : ""}`;
            });

            setTitlesTicker();
        });

        // кнопку "вернуться к прямому эфиру" нужно показывать только в случае
        // если в главном плеере играет подкаст
        const backToRadioBtn = document.querySelector(".page-header__back-to-live");

        backToRadioBtn.addEventListener("click", (event) => {
            toggleBackToRadioBtn(false);

            // удаляем id проигрываемой программы
            delete RadioZenit.currentlyPlayingProgramID;

            const mainPlaylist = document.getElementById("js-main-playlist");
            const podcastPlaylist = document.getElementById("js-podcast-playlist");

            mainPlaylist.style.display = "";
            podcastPlaylist.innerHTML = "";
            podcastPlaylist.style.display = "none";

            // меняем название проигрываемого в данный момент источника
            [ ...document.querySelectorAll(".main-player__text-line") ].forEach(line => {
                line.style.display = line.id !== "js-podcast-titles" ? "" : "none";
            });
        });

        function toggleBackToRadioBtn(show) {
            toggleAnimation({
                show,
                el: backToRadioBtn,
                visibleClass: "page-header__back-to-live_visible",
                animationClass: "page-header__back-to-live_appeared",
            });
        }

        // при смене трека, добавляем последний в историю эфира
        const mainPlayer = document.querySelector("audio[data-player='zenit-main-player']");

        mainPlayer.addEventListener("alEventHistory", (event) => {
            const { title, titleExecutorFull, titleTrack, sample } = event.detail.titlesData.short;
            const { startSongTimeString } = event.detail.titlesData.stat;

            if (title === "Реклама") return;

            const playlist = document.getElementById("js-main-playlist-list");
            const latestSongTitle = playlist
                .firstElementChild
                .querySelector(".player__track-title")
                .textContent
                .trim()
                .toLocaleLowerCase();
            const titleToCheck = titleExecutorFull
                .trim()
                .toLocaleLowerCase();

            // если последняя песня в истории уже есть - ничего не выводим
            if (latestSongTitle === titleToCheck) return;

            // добавляем трек в дом
            const newPlaylistItem = playlist.lastElementChild.cloneNode(true);
            playlist.lastElementChild.remove();

            const timeNode = newPlaylistItem.querySelector(".player__time");
            const titleNode = newPlaylistItem.querySelector(".player__track-title");
            timeNode.textContent = startSongTimeString;
            titleNode.textContent = titleExecutorFull;

            // элемент с названием песни может быть не у всех треков
            let trackNode = newPlaylistItem.querySelector(".player__track-name");

            if (titleTrack) {
                if (trackNode === null) {
                    trackNode = document.createElement("SPAN");
                    trackNode.className = "player__track-name";
                    newPlaylistItem
                        .querySelector(".player__inner")
                        .append(trackNode);
                }

                trackNode.textContent = titleTrack;
            }
            else if (trackNode !== null) {
                trackNode.remove();
            }

            let playBtn = newPlaylistItem.querySelector(".player__play-btn");

            playBtn.outerHTML = sample
                // если ссылка на семпл есть - выводим кнопку для воспроизвенения семпла
                ? `
                    <button
                        class="js-sample-btn play-btn play player__play-btn"
                        type="button"

                        aria-label="Начать воспроизведение"
                        data-player-button="zenit-main-player"
                        data-broadcast-button="${performance.now() /* любое уникальное значение */}"
                        data-track="${sample}"
                        data-pause="true"

                        data-track-title="${titleExecutorFull}"
                        data-track-name="${titleTrack}"
                    >
                        <svg class="play-btn__icon play-btn__icon_t_play" width="23" height="23">
                            <use xlink:href="/design/images/new-site--tmp/sprite.svg#play"></use>
                        </svg>
                        <svg class="play-btn__icon" width="23" height="23">
                            <use xlink:href="/design/images/new-site--tmp/sprite.svg#pause"></use>
                        </svg>
                    </button>
                `
                // если ссылки на семпл нет - выводим заглушку
                : `
                    <div class="play-btn play player__play-btn play-btn_disabled" title="трек не найден">
                        <svg class="play-btn__icon play-btn__icon_t_play " width="23" height="23">
                            <use xlink:href="/design/images/new-site--tmp/sprite.svg#play"></use>
                        </svg>
                    </div>
                `;

            playlist.prepend(newPlaylistItem);

            setTitlesTicker();
        });

        RadioZenit.isInited = true;

        /**
         * туглит элемент из состояния display: none (через css-классы)
         * и затем (через тик requestAnimationFrame) вешает класс анимации, и наоборот:
         * снимает класс анимации и после скрытия элемента, по transitionend,
         * скрывает в display: none (снимая класс видимости)
         * при первом вызове, вешает на элемент обработчик события transitionend
         * для обратного скрытия в display: none
         * !!! подходит только для элементов, которые общие для всего сайта
         * !!! в противном случае будет сохраняться ссылка на удаленные дом-ноды
         * !!! и будет утечечка памяти ¯\_(ツ)_/¯
         * 
         * @param {DOMNode} el - элемент, который нужно проанимировать
         * @param {Boolean} show - состояние, в которое должен быть установлен элемент
         * @param {String} visibleClass - класс видимости, переключает элемент из display: none
         * @param {String} animationClass - класс запуска анимации
         * @param {Function} [onStateToggle] - функция будет вызываться на каждом этапе анимации (появление/скрытие)
         * @param {Function} [onBeforeShowing] - функция будет вызываться только перед показом блока
         */
        function toggleAnimation({
            show,
            el,
            visibleClass,
            animationClass,
            onStateToggle,
            onBeforeShowing,
        }) {
            toggleAnimation.initedElements = toggleAnimation.initedElements || [];

            if ( !toggleAnimation.initedElements.includes(el) ) {
                el.addEventListener("transitionend", (event) => {
                    if ( !el.classList.contains(animationClass) ) {
                        el.classList.remove(visibleClass);
                    }
                });
                toggleAnimation.initedElements.push(el);
            }

            requestAnimationFrame((now) => {
                el.classList.toggle(show ? visibleClass : animationClass, show);

                if (typeof onStateToggle === "function") {
                    onStateToggle(show);
                }

                if (!show) return;

                requestAnimationFrame((now) => {
                    el.classList.toggle(show ? animationClass : visibleClass, show);

                    if (typeof onBeforeShowing === "function") {
                        onBeforeShowing();
                    }
                });
            });
        }
    });
};

// главная
RadioZenit.initializers[RadioZenit.indexPageAn] = () => {
    isDocReady(() => {
        const { body }= document;

        new Swiper(".index-banner", {
            slidesPerView: 1,
            resistanceRatio: 0,
            loop: true,
            autoplay: {
                delay: 7500,
                pauseOnMouseEnter: false,
            },
            pagination: {
                el: ".index-banner__pagination",
                modifierClass: "index-banner__pagination_",
                bulletClass: "index-banner__bullet",
                bulletActiveClass: "index-banner__bullet_active",
                clickable: true,
                renderBullet: function(index, className) {
                    return `<button class="${className}" title="${indexBannerTitles[index]}" type="button"><span class="index-banner__bullet-text">${indexBannerTitles[index]}</span></button>`;
                }
            },
        });

        let isPodcastSliderInited = false;
        let podcastSwiper = null;
        let isVideoSliderInited = false;
        let videoSwiper = null;

        checkIndexPageSliders();

        const an = getArticleName();
        RadioZenit.resizeHandlers[an] = throttle(checkIndexPageSliders, window, 200);
        window.addEventListener("resize", RadioZenit.resizeHandlers[an]);

        const newsTabBtns = document.querySelector(".tags_page_index");

        if (newsTabBtns === null) return;

        newsTabBtns.addEventListener("click", (event) => {
            const { target } = event;
            const targetTab = target.dataset.tab;

            if (!targetTab) return;

            [ ...document.querySelectorAll(".tags__btn[data-tab]") ].forEach(btn => {
                btn.classList.toggle("tags__btn_active", btn === target);
            });

            [ ...document.querySelectorAll(".news__inner_page_index[data-tab]") ].forEach(tab => {
                tab.classList.toggle("news__inner_visible", tab.dataset.tab === targetTab);
            });
        });

        function checkIndexPageSliders() {
            let viewportWidth = body.clientWidth;

            if (viewportWidth > 991) {
                if (isPodcastSliderInited) {
                    podcastSwiper.destroy(true, true);
                    isPodcastSliderInited = false;
                }
                if (isVideoSliderInited) {
                    videoSwiper.destroy(true, true);
                    isVideoSliderInited = false;
                }
            }
            else {
                if (!isPodcastSliderInited) {
                    podcastSwiper = new Swiper(".podcast-slider", {
                        slidesPerView: "auto",
                        resistanceRatio: 0,
                    });
                    isPodcastSliderInited = true;
                }
                if (!isVideoSliderInited) {
                    videoSwiper = new Swiper(".index-video-slider", {
                        slidesPerView: 1,
                        resistanceRatio: 0,
                        autoHeight: true,
                        pagination: {
                            el: ".index-video-slider__pagination",
                            modifierClass: "index-video-slider__pagination_",
                            bulletClass: "index-video-slider__bullet",
                            bulletActiveClass: "index-video-slider__bullet_active",
                        },
                    });
                    isVideoSliderInited = true;
                }
            }
        }
    });
};

// программы
RadioZenit.initializers[RadioZenit.programPageAn] = () => {
    if (RadioZenit.initedPages[RadioZenit.programPageAn]) return;

    isDocReady(() => {
        const podcastSliderSelector = ".podcast-slider";

        if (document.querySelector(podcastSliderSelector) === null) return;

        const { body } = document;
        let viewportWidth = body.clientWidth;

        let isPodcastSliderInited = false;
        let podcastSwiper = null;

        checkPodcastSlider();

        const an = getArticleName();
        RadioZenit.resizeHandlers[an] = throttle(checkPodcastSlider, window, 200);
        window.addEventListener("resize", RadioZenit.resizeHandlers[an]);

        RadioZenit.initedPages[RadioZenit.programPageAn] = true;

        function checkPodcastSlider() {
            viewportWidth = body.clientWidth;

            if (viewportWidth > 991) {
                if (isPodcastSliderInited) {
                    podcastSwiper.destroy(true, true);
                    isPodcastSliderInited = false;
                }
            }
            else {
                if (!isPodcastSliderInited) {
                    podcastSwiper = new Swiper(podcastSliderSelector, {
                        slidesPerView: "auto",
                        resistanceRatio: 0,
                    });
                    isPodcastSliderInited = true;
                }
            }
        }
    });
};

// "о нас"
RadioZenit.initializers[RadioZenit.aboutPageAn] = () => {
    isDocReady(() => {
        const { body } = document;
        let viewportWidth = body.clientWidth;

        let isTeamSliderInited = false;
        let teamSwiper = null;

        checkTeamSlider();

        const an = getArticleName();
        RadioZenit.resizeHandlers[an] = throttle(checkTeamSlider, window, 200);
        window.addEventListener("resize", RadioZenit.resizeHandlers[an]);

        function checkTeamSlider() {
            viewportWidth = body.clientWidth;

            if (viewportWidth > 991) {
                if (isTeamSliderInited) {
                    teamSwiper.destroy(true, true);
                    isTeamSliderInited = false;
                }
            }
            else {
                if (!isTeamSliderInited) {
                    teamSwiper = new Swiper(".team-slider", {
                        slidesPerView: "auto",
                        resistanceRatio: 0,
                    });
                    isTeamSliderInited = true;
                }
            }
        }
    });
};

/**
 * на некоторых страницах нужны дополнительные обработчики "resize" для слайдеров
 * при уходе на другую страницу нужно их снять,
 * чтобы не плодить кучу одинаковых обработчиков
 * и чтобы не держать лишнюю память
 * 
 * @param {String} [pageToExclude] - имя страницы, на которую переходим (с нее не снимается)
 *                                   если параметр опущен, снимаются все обработчики
 */
RadioZenit.removeResizeHandlers = (pageToExclude = null) => {
    for (const an in RadioZenit.resizeHandlers) {
        if (an === pageToExclude) continue;

        window.removeEventListener("resize", RadioZenit.resizeHandlers[an]);
        delete RadioZenit.resizeHandlers[an];
        delete RadioZenit.initedPages[an];
    }
};

onPageEnter();

/**
 * инициализируем необходимые для страниц скрипты
 * и снимаем лишние обработчики
 */
function onPageEnter() {
    isDocReady(() => {
        RadioZenit.initCommon();

        const an = getArticleName();

        if (typeof RadioZenit.initializers[an] === "function") {
            RadioZenit.initializers[an]();
        }
        
        RadioZenit.removeResizeHandlers(an);
    });
}

// вспомогательные функции

function throttle(fn, ctx, ms) {
    let pendingCall = null;
    let lastCall = -ms;

    const decorator = function() {
        const now = performance.now();
        const diff = now - lastCall;
        const args = arguments;
        clearTimeout(pendingCall);

        if (diff >= ms) {
            lastCall = now;
            fn.call(ctx, ...args);
        }
        else {
            pendingCall = setTimeout(decorator, ms - diff, args);
        }
    };

    return decorator;
}

/**
 * проверяет нужно ли титрам добавить анимацию бегущей строки
 * вешается только в том случае, если содержимое выходит за границы блока
 */
function setTitlesTicker() {
    const titlesLines = [ ...document.querySelectorAll(".main-player__text-line:not(.main-player__text-line_t_title)") ];

    let visibleLine = null;

    titlesLines.forEach(line => {
        if (line.style.display !== "none") {
            visibleLine = line;
            return;
        }
    });

    if (visibleLine === null) return;

    const parent = visibleLine.closest(".main-player__inner");
    visibleLine.classList.toggle("main-player__text-line_ticking", visibleLine.scrollWidth > parent.offsetWidth);
}

function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
}

function getArticleName() {
    return MP.ParseQueryString(window.location.href).an || "index";
}