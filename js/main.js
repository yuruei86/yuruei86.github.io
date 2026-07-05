document.addEventListener("DOMContentLoaded", () => {
    
    /* ==========================================
       0. 開頭過場動畫控制邏輯
       ========================================== */
    const introOverlay = document.getElementById("introOverlay");
    const introGif = document.getElementById("introGif");
    const introProgressBar = document.getElementById("introProgressBar");
    
    // 定義過場動畫播放時長 (毫秒)
    const INTRO_DURATION = 2400; 

    if (introOverlay && introGif && introProgressBar) {
        // 1. 鎖定網頁滾動，防止使用者在過場期間滑動
        document.body.style.overflow = "hidden";

        // 2. 加上時間戳記強制重播 GIF，確保每次載入均從第一格影格開始播放
        const originalSrc = introGif.getAttribute("src");
        introGif.src = `${originalSrc}?t=${Date.now()}`;

        // 3. 啟動進度條動畫 (延遲 50ms 確保瀏覽器已完成初始渲染)
        setTimeout(() => {
            introProgressBar.style.width = "100%";
        }, 50);

        // 4. 當動畫播完後淡出遮罩並解鎖滾動
        setTimeout(() => {
            introOverlay.classList.add("fade-out");
            
            // 等待淡出 CSS 轉場 (0.6s) 結束後釋放滾動條，並移除節點節省記憶體
            setTimeout(() => {
                document.body.style.overflow = "";
                introOverlay.remove();
            }, 600);
        }, INTRO_DURATION);
    }

    /* ==========================================
       1. 橘色區塊 - Tab 頁籤切換邏輯 (含按鈕圖切換)
       ========================================== */
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // 移除所有按鈕的 active 狀態，並把圖片還原為不亮款 (itd_btn_X-1)
            tabButtons.forEach(b => {
                b.classList.remove("active");
                const img = b.querySelector("img");
                if (img) img.src = img.getAttribute("data-inactive");
            });

            // 隱藏所有面板
            tabPanels.forEach(panel => panel.classList.remove("active"));

            // 啟用當前按鈕
            btn.classList.add("active");
            const currentImg = btn.querySelector("img");
            if (currentImg) currentImg.src = currentImg.getAttribute("data-active");

            // 顯示相對應的面板
            const targetTabId = btn.getAttribute("data-tab");
            document.getElementById(targetTabId).classList.add("active");
        });
    });

    /* ==========================================
       2. 橫向 Banner 點擊 - RWD 彈跳視窗邏輯
       ========================================== */
    const bnItems = document.querySelectorAll(".bn-item");
    const modal = document.getElementById("bnModal");
    const modalImg = document.getElementById("modalImg");

    bnItems.forEach(item => {
        item.addEventListener("click", () => {
            const bnIndex = item.getAttribute("data-bn");
            const isMobile = window.innerWidth <= 1023;
            
            // 依據目前螢幕寬度判定載入的手機版或電腦版 Demo 圖片
            let targetImgPath = "";
            if (isMobile) {
                targetImgPath = `images/Bn-${bnIndex}_mb_Demo.jpg`;
            } else {
                targetImgPath = `images/Bn-${bnIndex}_pc_Demo.jpg`;
            }

            // 更新彈蓋圖片源並開啟
            modalImg.loading = "lazy";
            modalImg.src = targetImgPath;
            modal.classList.add("open");
            document.body.style.overflow = "hidden"; // 彈出時禁止底層網頁滾動
        });
    });

    // 點擊彈跳視窗外部任意區域（非圖片本體）即關閉視窗
    modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target.classList.contains('modal-content')) {
            modal.classList.remove("open");
            document.body.style.overflow = ""; // 恢復網頁滾動
            modalImg.src = ""; // 清空圖片源
        }
    });

    /* ==========================================
       3. Banner 自動輪播 & 拖曳邏輯
       ========================================== */
    const bannerSection = document.querySelector(".banner-grid-section");
    const bannerItems = document.querySelectorAll(".bn-item");
    let currentBannerIndex = 0;
    let autoPlayInterval;
    let autoPlayDelayTimeout; // 自動輪播延遲計時器
    
    // 拖曳相關變數
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let dragThreshold = 50; // 拖曳超過 50px 才會切換圖片

    function slideToBanner(index) {
        if (bannerSection && bannerItems.length > 0) {
            // 確保 index 在有效範圍內
            if (index >= bannerItems.length) {
                currentBannerIndex = 0;
            } else if (index < 0) {
                currentBannerIndex = bannerItems.length - 1;
            } else {
                currentBannerIndex = index;
            }

            // 計算 scroll 位置
            const itemWidth = bannerItems[0].offsetWidth;
            const scrollLeft = currentBannerIndex * itemWidth;
            
            // 平滑滾動
            bannerSection.scrollTo({
                left: scrollLeft,
                behavior: "smooth"
            });
        }
    }

    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            slideToBanner(currentBannerIndex + 1);
        }, 3000); // 每 3 秒切換一次
    }

    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }

    function resumeAutoPlayWithDelay() {
        // 清除之前的延遲計時器
        clearTimeout(autoPlayDelayTimeout);
        // 設置 3 秒延遲後恢復自動輪播
        autoPlayDelayTimeout = setTimeout(() => {
            startAutoPlay();
        }, 3000);
    }

    // 滑鼠拖曳事件
    if (bannerSection && bannerItems.length > 0) {
        bannerSection.addEventListener("mousedown", (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartScrollLeft = bannerSection.scrollLeft;
            stopAutoPlay();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            
            const dragDistance = dragStartX - e.clientX;
            bannerSection.scrollLeft = dragStartScrollLeft + dragDistance;
        });

        document.addEventListener("mouseup", () => {
            if (!isDragging) return;
            isDragging = false;
            
            const dragDistance = dragStartX - event.clientX;
            
            // 根據拖曳距離決定滾動
            if (Math.abs(dragDistance) > dragThreshold) {
                if (dragDistance > 0) {
                    // 向左拖曳 → 下一張
                    slideToBanner(currentBannerIndex + 1);
                } else {
                    // 向右拖曳 → 上一張
                    slideToBanner(currentBannerIndex - 1);
                }
            } else {
                // 拖曳距離不足，回到當前圖片
                slideToBanner(currentBannerIndex);
            }
            
            // 拖曳完成後 3 秒才恢復自動輪播
            resumeAutoPlayWithDelay();
        });

        // 觸控設備拖曳事件
        bannerSection.addEventListener("touchstart", (e) => {
            isDragging = true;
            dragStartX = e.touches[0].clientX;
            dragStartScrollLeft = bannerSection.scrollLeft;
            stopAutoPlay();
        });

        document.addEventListener("touchmove", (e) => {
            if (!isDragging) return;
            
            const dragDistance = dragStartX - e.touches[0].clientX;
            bannerSection.scrollLeft = dragStartScrollLeft + dragDistance;
        });

        document.addEventListener("touchend", () => {
            if (!isDragging) return;
            isDragging = false;
            
            const dragDistance = dragStartX - event.changedTouches[0].clientX;
            
            // 根據拖曳距離決定滾動
            if (Math.abs(dragDistance) > dragThreshold) {
                if (dragDistance > 0) {
                    slideToBanner(currentBannerIndex + 1);
                } else {
                    slideToBanner(currentBannerIndex - 1);
                }
            } else {
                slideToBanner(currentBannerIndex);
            }
            
            resumeAutoPlayWithDelay();
        });

        // 滑鼠懸停時暫停輪播
        bannerSection.addEventListener("mouseenter", stopAutoPlay);
        // 滑鼠離開時繼續輪播
        bannerSection.addEventListener("mouseleave", startAutoPlay);

        // 初始化自動輪播
        startAutoPlay();
    }

    /* ==========================================
       4. 複製按鈕：hover 換圖 + click 複製文字
       ========================================== */
    const copyButtons = document.querySelectorAll(".copy-1, .copy-2");

    function copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        const success = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (!success) {
            return Promise.reject(new Error("copy failed"));
        }

        return Promise.resolve();
    }

    copyButtons.forEach(btn => {
        const defaultSrc = btn.dataset.defaultSrc;
        const hoverSrc = btn.dataset.hoverSrc;
        const copyText = btn.dataset.copy;

        if (!copyText) return;

        btn.addEventListener("mouseenter", () => {
            if (hoverSrc) btn.src = hoverSrc;
        });

        btn.addEventListener("mouseleave", () => {
            if (defaultSrc) btn.src = defaultSrc;
        });

        btn.addEventListener("click", () => {
            copyTextToClipboard(copyText);
        });

        btn.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                copyTextToClipboard(copyText);
            }
        });
    });

    const headImg = document.querySelector(".img-head");
    const headBgDesktop = document.querySelector(".head-bg.pc-only");
    const headBgMobile = document.querySelector(".head-bg.mb-only");
    const header = document.querySelector("header.header");

    if (headImg) {
        const desktopHover = window.matchMedia("(min-width: 1367px)");
        const defaultHeadSrc = headImg.dataset.defaultSrc;
        const activeHeadSrc = headImg.dataset.activeSrc;
        
        let gifTimer = null;
        const gifDuration = 2000; // GIF 播放一次的估計時長 (毫秒)，可依需求自行微調

        function setHeadImage(src, isGif = false) {
            if (!src) return;
            if (isGif) {
                // 加上時間戳記作為 query parameter，強制瀏覽器重新從第一格播放 GIF
                headImg.src = `${src}?t=${Date.now()}`;
            } else {
                headImg.src = src;
            }
        }

        function playGifOnce() {
            if (gifTimer) {
                // 若正在播放中，點擊第二次則中斷播放並變回靜態圖
                clearTimeout(gifTimer);
                gifTimer = null;
                setHeadImage(defaultHeadSrc, false);
            } else {
                // 初次點擊，播放 GIF
                setHeadImage(activeHeadSrc, true);
                gifTimer = setTimeout(() => {
                    setHeadImage(defaultHeadSrc, false);
                    gifTimer = null; // 播放完畢，重設狀態
                }, gifDuration);
            }
        }

        function enableDesktopHover() {
            // 移除行動裝置的點擊監聽器
            headImg.removeEventListener("click", handleMobileClick);

            // 移除舊的監聽事件避免重複綁定 (若是切換尺寸時)
            headImg.removeEventListener("mouseenter", handleMouseEnter);
            headImg.removeEventListener("mouseleave", handleMouseLeave);
            
            headImg.addEventListener("mouseenter", handleMouseEnter);
            headImg.addEventListener("mouseleave", handleMouseLeave);
        }

        function handleMouseEnter() {
            if (gifTimer) {
                clearTimeout(gifTimer);
                gifTimer = null;
            }
            setHeadImage(activeHeadSrc, true);
        }

        function handleMouseLeave() {
            if (gifTimer) {
                clearTimeout(gifTimer);
                gifTimer = null;
            }
            setHeadImage(defaultHeadSrc, false);
        }

        function enableMobilePress() {
            // 確保移除舊的事件，防重複綁定
            headImg.removeEventListener("click", handleMobileClick);
            // 行動裝置改用點擊事件觸發
            headImg.addEventListener("click", handleMobileClick);
        }

        function handleMobileClick() {
            playGifOnce();
        }

        if (desktopHover.matches) {
            enableDesktopHover();
        } else {
            enableMobilePress();
        }

        desktopHover.addEventListener("change", (e) => {
            setHeadImage(defaultHeadSrc, false);
            if (gifTimer) clearTimeout(gifTimer);
            if (e.matches) {
                enableDesktopHover();
            } else {
                enableMobilePress();
            }
        });

        let lastScrollY = window.scrollY;
        let headScrollOffset = 0;
        const maxHeadScrollOffset = 350;

    window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    const deltaY = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    // --- 修改這裡 ---
    const slowFactor = 0.2; // 數值越小，移動越慢 (0 ~ 1 之間)
    const easedDeltaY = deltaY * slowFactor;
    
    // 使用減速後的數值更新
    headScrollOffset = Math.max(0, Math.min(maxHeadScrollOffset, headScrollOffset + easedDeltaY));
    // ----------------
    
    headImg.style.setProperty("--head-scroll-offset", `${headScrollOffset}px`);
}, { passive: true });
    }

    if (header && headBgDesktop) {
        header.addEventListener("mousemove", (event) => {
            const rect = header.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const offsetX = Math.max(-1, Math.min(1, (event.clientX - centerX) / (rect.width / 2)));
            const offsetY = Math.max(-1, Math.min(1, (event.clientY - centerY) / (rect.height / 2)));
            const maxMove = 20;
            const moveX = -offsetX * maxMove;
            const moveY = -offsetY * maxMove;
            headBgDesktop.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        });

        header.addEventListener("mouseleave", () => {
            headBgDesktop.style.transform = "translate(-50%, -50%)";
        });
    }

    if (headBgMobile || headBgDesktop) {
        function updateMobileHeadBg(event) {
            const maxMove = 15;   // --- 陀螺儀最大單向位移距離 (像素)，往返總共 30px ---
            const gamma = event.gamma || 0;
            const beta = event.beta || 0;
            
            // 提高靈敏度：除以 15 (代表傾斜 15 度即達到最大位移值)，並以 45 度手持為基準
            const normalizedX = Math.max(-1, Math.min(1, gamma / 15));
            const normalizedY = Math.max(-1, Math.min(1, (beta - 45) / 15));

            // 取得目前螢幕的旋轉方向 (0, 90, -90, 180)
            const orientation = (screen.orientation && typeof screen.orientation.angle === 'number') 
                ? screen.orientation.angle 
                : (typeof window.orientation === 'number' ? window.orientation : 0);
                
            let moveX = 0;
            let moveY = 0;

            if (orientation === 90) {
                // 橫向平板 (逆時針旋轉 90 度)
                moveX = -normalizedY * maxMove;
                moveY = normalizedX * maxMove;
            } else if (orientation === -90 || orientation === 270) {
                // 橫向平板 (順時針旋轉 90 度)
                moveX = normalizedY * maxMove;
                moveY = -normalizedX * maxMove;
            } else if (orientation === 180) {
                // 反向直向
                moveX = normalizedX * maxMove;
                moveY = normalizedY * maxMove;
            } else {
                // 一般直向
                moveX = -normalizedX * maxMove;
                moveY = -normalizedY * maxMove;
            }

            const transformValue = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
            
            if (headBgMobile) headBgMobile.style.transform = transformValue;
            if (headBgDesktop) headBgDesktop.style.transform = transformValue;
        }

        // 初始化陀螺儀監聽與 iOS 授權機制
        function initDeviceOrientation() {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS 13+ 需要使用者點擊授權才能取得陀螺儀數據
                const requestPermission = () => {
                    DeviceOrientationEvent.requestPermission()
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                window.addEventListener("deviceorientation", updateMobileHeadBg, true);
                            }
                            cleanupListeners();
                        })
                        .catch(err => {
                            console.error("Gyro permission error:", err);
                            cleanupListeners();
                        });
                };
                
                const cleanupListeners = () => {
                    document.removeEventListener('click', requestPermission);
                    document.removeEventListener('touchend', requestPermission);
                };
                
                // 綁定於安全的使用者互動事件 (click 與 touchend)，iOS Safari 不支援 touchstart 授權
                document.addEventListener('click', requestPermission);
                document.addEventListener('touchend', requestPermission);
            } else {
                // Android 或非 iOS 系統，直接監聽
                window.addEventListener("deviceorientation", updateMobileHeadBg, true);
            }
        }

        initDeviceOrientation();

        window.addEventListener("orientationchange", () => {
            if (headBgMobile) headBgMobile.style.transform = "translate(-50%, -50%)";
            if (headBgDesktop) headBgDesktop.style.transform = "translate(-50%, -50%)";
        });
    }

    /* ==========================================
       5. 瀑布流卡片滾動進場動畫 (Intersection Observer)
       ========================================== */
    const masonryItems = document.querySelectorAll(".masonry-item");

    if (masonryItems.length > 0) {
        const observerOptions = {
            root: null, // 以 viewport 為基準
            rootMargin: "0px 0px -80px 0px", // 卡片露出底緣 80px 時觸發，體驗更精緻
            threshold: 0.05 // 露出 5% 開始進行轉場
        };

        const masonryObserver = new IntersectionObserver((entries, observer) => {
            // 獲取當前進入視窗的卡片
            const intersectingEntries = entries.filter(entry => entry.isIntersecting);
            
            intersectingEntries.forEach((entry, index) => {
                const item = entry.target;
                
                // 為同時進入視窗的卡片計算交錯延遲 (Stagger Delay)，間隔 100ms
                item.style.setProperty("--delay", `${index * 100}ms`);
                item.classList.add("show");
                
                // 載入完成後停止監聽此卡片，避免重複觸發，確保流暢度
                observer.unobserve(item);
            });
        }, observerOptions);

        masonryItems.forEach(item => {
            masonryObserver.observe(item);
        });
    }
});