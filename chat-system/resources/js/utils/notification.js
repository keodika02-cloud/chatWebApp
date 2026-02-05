export const requestNotificationPermission = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
};

const audio = new Audio("https://notificationsounds.com/storage/sounds/file-sounds-1233-elegant.mp3");

export const playSound = () => {
    try {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio requires interaction first:", e));
    } catch (e) {
        console.error("Sound error", e);
    }
};

let flashInterval = null;
const originalTitle = document.title || "Chat System";

export const flashTitle = (text) => {
    if (flashInterval) clearInterval(flashInterval);

    let isOriginal = true;
    flashInterval = setInterval(() => {
        document.title = isOriginal ? text : originalTitle;
        isOriginal = !isOriginal;
    }, 1000);

    // Tự động dừng khi quay lại tab
    const stopFlash = () => {
        if (document.visibilityState === 'visible') {
            clearInterval(flashInterval);
            document.title = originalTitle;
            document.removeEventListener('visibilitychange', stopFlash);
        }
    };
    document.addEventListener('visibilitychange', stopFlash);
};

export const sendDesktopNotification = (title, body, icon = null) => {
    if (document.visibilityState === 'visible') return; // Chỉ hiện khi đang ẩn tab

    if (Notification.permission === "granted") {
        new Notification(title, {
            body,
            icon: icon || 'https://cdn-icons-png.flaticon.com/512/724/724715.png'
        });
        flashTitle("🔔 Tin nhắn mới!");
    }
};
