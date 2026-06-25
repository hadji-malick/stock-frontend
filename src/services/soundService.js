const sounds = {
    success: '/sounds/success.mp3',
    warning: '/sounds/warning.mp3',
    info: '/sounds/info.mp3'
};

export const playNotificationSound = (type = 'info') => {
    try {
        const audio = new Audio(sounds[type] || sounds.info);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {
        // Ignorer les erreurs de son
    }
};