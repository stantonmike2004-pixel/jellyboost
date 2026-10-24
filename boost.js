// ==UserScript==
// @name         JellyBoost (Jellyfin Audio Booster)
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Boosts Jellyfin audio up to 5x with hover-reveal, matching purple theme, and precise positioning
// @match        http://localhost:8096/*
// @match        http://127.0.0.1:8096/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let audioCtx = null;
    let gainNode = null;
    let currentBoostIndex = 0;
    let hideTimeout = null;
    const boostLevels = [1.0, 1.5, 2.0, 3.0, 5.0];
    const boostLabels = [' 100%', ' 1.5x', ' 2.0x', ' 3.0x', ' 5.0x'];

    function initAudioBooster() {
        const video = document.querySelector('video');
        if (!video) {
            const existingWrapper = document.getElementById('jellyfin-boost-wrapper');
            if (existingWrapper) existingWrapper.remove();
            return;
        }

        if (document.getElementById('jellyfin-boost-wrapper')) return;

        if (!audioCtx) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                gainNode = audioCtx.createGain();
                gainNode.gain.value = boostLevels[currentBoostIndex];

                if (!video._jellyBoostConnected) {
                    const sourceNode = audioCtx.createMediaElementSource(video);
                    sourceNode.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    video._jellyBoostConnected = true;
                }
            } catch (e) {
                console.error('JellyBoost initialization error:', e);
                return;
            }
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'jellyfin-boost-wrapper';
        wrapper.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 450px;
            width: 100px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            z-index: 2147483647;
            background: transparent;
        `;

        const btn = document.createElement('button');
        btn.id = 'jellyfin-boost-btn';
        btn.type = 'button';
        btn.innerHTML = boostLabels[currentBoostIndex];

        btn.style.cssText = `
            position: absolute;
            bottom: 8px;
            left: 0px;
            display: inline-flex;
            align-items: center;
            background: rgba(20, 20, 25, 0.85);
            color: #ffffff;
            border: 1px solid rgba(170, 92, 195, 0.5);
            border-radius: 16px;
            padding: 4px 14px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            font-family: inherit;
            vertical-align: middle;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            user-select: none;
        `;

        wrapper.addEventListener('mouseenter', () => {
            btn.style.opacity = '1';
            btn.style.visibility = 'visible';
        });

        wrapper.addEventListener('mouseleave', () => {
            btn.style.opacity = '0';
            btn.style.visibility = 'hidden';
        });

        btn.onclick = function (e) {
            e.stopPropagation();
            e.preventDefault();
            
            currentBoostIndex = (currentBoostIndex + 1) % boostLevels.length;
            const newGain = boostLevels[currentBoostIndex];
            
            if (gainNode) {
                gainNode.gain.value = newGain;
            }

            btn.innerHTML = boostLabels[currentBoostIndex];
            
            if (newGain > 1.0) {
                btn.style.background = 'rgba(170, 92, 195, 0.9)';
                btn.style.borderColor = '#e2aaff';
                btn.style.boxShadow = '0 0 12px rgba(170, 92, 195, 0.6)';
            } else {
                btn.style.background = 'rgba(20, 20, 25, 0.85)';
                btn.style.borderColor = 'rgba(170, 92, 195, 0.5)';
                btn.style.boxShadow = 'none';
            }
        };

        wrapper.appendChild(btn);
        document.body.appendChild(wrapper);

        function resetHideTimer() {
            wrapper.style.cursor = 'default';
            document.body.style.cursor = 'default';

            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                wrapper.style.cursor = 'none';
                document.body.style.cursor = 'none';
            }, 3000);
        }

        window.addEventListener('mousemove', resetHideTimer, true);
        resetHideTimer();
    }

    const observer = new MutationObserver(() => {
        initAudioBooster();
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();