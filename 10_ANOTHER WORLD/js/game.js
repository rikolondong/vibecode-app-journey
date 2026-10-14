// DUNIA LAIN: MALAM UJI NYALI - Core Game Engine (FNAF Style Mechanics)
class DuniaLainGame {
    constructor() {
        // Game Configuration
        this.night = 1;
        this.inGame = false;
        this.hour = 0; // 0 = 12 AM, 1 = 1 AM, ..., 6 = 6 AM (Subuh)
        this.hourDurationMs = 50000; // 50 seconds per in-game hour
        this.clockInterval = null;
        this.gameLoopInterval = null;

        // Battery & Power System
        this.battery = 100.0;
        this.baseDrainRate = 0.08; // % per second
        this.powerUsage = 1; // 1 to 5 bars
        this.isBlackout = false;

        // Doors & Lights
        this.doorLeft = false;   // false = open, true = closed
        this.doorRight = false;
        this.lightLeft = false;
        this.lightRight = false;

        // Pan Position (3-way office panoramic)
        this.panX = -30; // -30% is center, -0% is left, -60% is right
        this.targetPanX = -30;

        // CCTV System
        this.cctvOpen = false;
        this.currentCam = 4; // Default on CAM 4 (Pohon Beringin)
        this.cameraImages = {
            1: 'assets/images/cam01_hallway.jpg',
            2: 'assets/images/cam02_morgue.jpg',
            3: 'assets/images/cam03_surgery.jpg',
            4: 'assets/images/cam04_banyan.jpg',
            5: 'assets/images/cam05_participant.jpg',
            6: 'assets/images/door_left_pocong.jpg',
            7: 'assets/images/door_right_kunti.jpg',
            8: 'assets/images/cam08_generator.jpg'
        };
        this.cameraNames = {
            1: 'CAM 01 - LORONG UTAMA',
            2: 'CAM 02 - KAMAR JENAZAH',
            3: 'CAM 03 - RUANG BEDAH TUA',
            4: 'CAM 04 - POHON BERINGIN',
            5: 'CAM 05 - RUANG UJI NYALI (PESERTA)',
            6: 'CAM 06 - LORONG SAYAP KIRI',
            7: 'CAM 07 - LORONG SAYAP KANAN',
            8: 'CAM 08 - RUANG GENERATOR & AKI'
        };

        // Ghost AI States & Locations
        // Pocong: 4 (Banyan) -> 1 (Hallway) -> 6 (Left Wing) -> Office Door Left (99)
        this.pocongLocation = 4;
        this.pocongAttackTimer = null;
        this.pocongDoorGraceMs = 3500; // Grace period to close left door

        // Kuntilanak: 3 (Surgery) -> 5 (Participant) -> 7 (Right Wing) -> Office Door Right (99)
        this.kuntiLocation = 3;
        this.kuntiAttackTimer = null;
        this.kuntiDoorGraceMs = 3800;

        // Genderuwo: 2 (Morgue) -> 8 (Generator - drains power!)
        this.genderuwoLocation = 2;

        // Tuyul: 8 (Generator)
        this.tuyulTimer = 0;

        // Contestant Candle (CAM 05)
        this.candleHealth = 100.0;
        this.candleExtinguishedTimer = 0;

        // DOM Elements
        this.bindElements();
        this.bindEvents();
    }

    bindElements() {
        // Screens
        this.screenTitle = document.getElementById('screen-title');
        this.screenOffice = document.getElementById('screen-office');
        this.screenCctv = document.getElementById('screen-cctv');
        this.screenJumpscare = document.getElementById('screen-jumpscare');
        this.screenGameOver = document.getElementById('screen-gameover');
        this.screenWin = document.getElementById('screen-win');
        this.blackoutScreen = document.getElementById('blackout-screen');
        this.modalGuide = document.getElementById('modal-guide');

        // Office Controls & Visuals
        this.officeViewport = document.getElementById('office-viewport');
        this.shutterLeft = document.getElementById('shutter-left');
        this.shutterRight = document.getElementById('shutter-right');
        this.spotlightLeft = document.getElementById('spotlight-left');
        this.spotlightRight = document.getElementById('spotlight-right');
        this.btnDoorLeft = document.getElementById('btn-door-left');
        this.btnLightLeft = document.getElementById('btn-light-left');
        this.btnDoorRight = document.getElementById('btn-door-right');
        this.btnLightRight = document.getElementById('btn-light-right');
        this.textDoorLeft = document.getElementById('text-door-left');
        this.textDoorRight = document.getElementById('text-door-right');

        // HUD Elements
        this.hudTime = document.getElementById('hud-time');
        this.hudNight = document.getElementById('hud-night');
        this.batteryPercent = document.getElementById('battery-percent');
        this.batteryFill = document.getElementById('battery-fill');
        this.usageBars = document.getElementById('usage-bars');

        // CCTV Elements
        this.cctvImage = document.getElementById('cctv-image');
        this.cctvCameraName = document.getElementById('cctv-camera-name');
        this.btnToggleCctv = document.getElementById('btn-toggle-cctv');
        this.btnCloseCctv = document.getElementById('btn-close-cctv');
        this.participantPanel = document.getElementById('participant-panel');
        this.candleFill = document.getElementById('candle-fill');
        this.candleText = document.getElementById('candle-text');
        this.btnRelightCandle = document.getElementById('btn-relight-candle');
        this.btnAudioDistract = document.getElementById('btn-audio-distract');
        this.btnEmergencySurrender = document.getElementById('btn-emergency-surrender');
        this.camButtons = document.querySelectorAll('.cam-btn');

        // End Game Elements
        this.gameoverReason = document.getElementById('gameover-reason');
        this.jumpscareImage = document.getElementById('jumpscare-image');
    }

    bindEvents() {
        // Title Buttons
        document.getElementById('btn-start-night1').addEventListener('click', () => this.startNight(1));
        document.getElementById('btn-start-night2').addEventListener('click', () => this.startNight(2));
        document.getElementById('btn-start-night3').addEventListener('click', () => this.startNight(3));
        document.getElementById('btn-open-guide').addEventListener('click', () => this.modalGuide.classList.add('active'));
        document.getElementById('btn-close-guide').addEventListener('click', () => this.modalGuide.classList.remove('active'));

        document.getElementById('btn-retry').addEventListener('click', () => this.startNight(this.night));
        document.getElementById('btn-back-menu').addEventListener('click', () => this.showTitleScreen());
        document.getElementById('btn-next-night').addEventListener('click', () => {
            if (this.night < 3) this.startNight(this.night + 1);
            else this.showTitleScreen();
        });

        // Office Controls - Buttons
        this.btnDoorLeft.addEventListener('click', () => this.toggleDoor('left'));
        this.btnLightLeft.addEventListener('click', () => this.toggleLight('left'));
        this.btnDoorRight.addEventListener('click', () => this.toggleDoor('right'));
        this.btnLightRight.addEventListener('click', () => this.toggleLight('right'));

        // CCTV Toggles
        this.btnToggleCctv.addEventListener('click', () => this.toggleCCTV());
        this.btnCloseCctv.addEventListener('click', () => this.toggleCCTV());

        // Minimap Cams
        this.camButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const camNum = parseInt(e.currentTarget.dataset.cam, 10);
                this.switchCamera(camNum);
            });
        });

        // CAM Actions
        this.btnRelightCandle.addEventListener('click', () => this.relightCandle());
        this.btnAudioDistract.addEventListener('click', () => this.triggerAudioDistract());
        this.btnEmergencySurrender.addEventListener('click', () => this.surrenderLambaikanTangan());

        // Panoramic Panning via Mouse
        const container = document.getElementById('game-container');
        container.addEventListener('mousemove', (e) => {
            if (!this.inGame || this.cctvOpen || this.isBlackout) return;
            const width = window.innerWidth;
            const mouseX = e.clientX;
            const ratio = mouseX / width; // 0 (left) to 1 (right)

            // Map ratio 0..1 to pan -0% .. -60%
            this.targetPanX = -(ratio * 60);
        });

        // Keyboard Shortcuts (FNAF Style)
        window.addEventListener('keydown', (e) => {
            if (!this.inGame || this.isBlackout) return;
            const key = e.key.toUpperCase();

            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleCCTV();
            } else if (key === 'Q') {
                this.toggleDoor('left');
            } else if (key === 'A') {
                this.toggleLight('left');
            } else if (key === 'E') {
                this.toggleDoor('right');
            } else if (key === 'D') {
                this.toggleLight('right');
            }
        });

        // Smooth Viewport Panning Render Loop
        const panLoop = () => {
            if (this.inGame && !this.cctvOpen) {
                this.panX += (this.targetPanX - this.panX) * 0.12;
                this.officeViewport.style.left = `${this.panX}%`;
            }
            requestAnimationFrame(panLoop);
        };
        requestAnimationFrame(panLoop);
    }

    showTitleScreen() {
        this.inGame = false;
        clearInterval(this.clockInterval);
        clearInterval(this.gameLoopInterval);
        this.screenTitle.classList.add('active');
        this.screenOffice.classList.remove('active');
        this.screenCctv.classList.remove('active');
        this.screenGameOver.classList.remove('active');
        this.screenWin.classList.remove('active');
        this.screenJumpscare.classList.remove('active');
        this.blackoutScreen.classList.remove('active');
    }

    startNight(nightNumber) {
        // Audio Init on User Gesture
        window.audioMgr.init();

        this.night = nightNumber;
        this.inGame = true;
        this.hour = 0;
        this.battery = 100.0;
        this.isBlackout = false;
        this.doorLeft = false;
        this.doorRight = false;
        this.lightLeft = false;
        this.lightRight = false;
        this.cctvOpen = false;
        this.currentCam = 4;
        this.candleHealth = 100.0;
        this.candleExtinguishedTimer = 0;

        // Reset Ghost Positions
        this.pocongLocation = 4; // Beringin
        this.kuntiLocation = 3;  // Surgery
        this.genderuwoLocation = 2; // Morgue

        // UI Reset
        this.screenTitle.classList.remove('active');
        this.screenGameOver.classList.remove('active');
        this.screenWin.classList.remove('active');
        this.screenJumpscare.classList.remove('active');
        this.blackoutScreen.classList.remove('active');
        this.screenOffice.classList.add('active');
        this.screenCctv.classList.remove('active');

        this.updateDoorUI();
        this.updateHUD();
        this.switchCamera(4);

        // Sound cue
        window.audioMgr.playWalkieTalkie();

        // Start Clock (Progression to 6 AM)
        clearInterval(this.clockInterval);
        this.clockInterval = setInterval(() => this.tickClock(), this.hourDurationMs);

        // Start High-frequency Game Loop (every 100ms)
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => this.updateLoop(), 100);

        // Schedule Ghost AI Steps
        this.setupGhostAISchedules();
    }

    tickClock() {
        if (!this.inGame) return;
        this.hour++;
        window.audioMgr.playWalkieTalkie();

        if (this.hour >= 6) {
            this.victory();
        } else {
            this.updateHUD();
        }
    }

    updateHUD() {
        const hourStr = this.hour === 0 ? '12:00 AM' : `0${this.hour}:00 AM`;
        this.hudTime.textContent = hourStr;
        this.hudNight.textContent = `MALAM ${this.night} - UJI NYALI`;
    }

    // Main Update Loop for Battery, Candle, AI checks
    updateLoop() {
        if (!this.inGame) return;

        // Calculate Power Usage (1 to 5)
        let usage = 1; // base van power
        if (this.doorLeft) usage++;
        if (this.doorRight) usage++;
        if (this.lightLeft) usage++;
        if (this.lightRight) usage++;
        if (this.cctvOpen) usage++;
        if (this.genderuwoLocation === 8) usage += 2; // Genderuwo draining generator!

        this.powerUsage = Math.min(5, usage);
        this.renderUsageBars(this.powerUsage);

        // Battery Depletion
        const drain = (this.baseDrainRate * (this.powerUsage * 0.75)) * 0.1; // 100ms slice
        this.battery = Math.max(0, this.battery - drain);

        this.batteryPercent.textContent = `${Math.floor(this.battery)}%`;
        this.batteryFill.style.width = `${this.battery}%`;

        if (this.battery < 20) {
            this.batteryFill.className = 'battery-fill critical';
        } else if (this.battery < 45) {
            this.batteryFill.className = 'battery-fill low';
        } else {
            this.batteryFill.className = 'battery-fill';
        }

        // Check Blackout
        if (this.battery <= 0 && !this.isBlackout) {
            this.triggerBlackout();
            return;
        }

        // Contestant Candle Depletion (CAM 05)
        let candleDrain = 0.12; // base drain per 100ms
        if (this.kuntiLocation === 5) candleDrain = 0.5; // Kunti blowing candle!

        this.candleHealth = Math.max(0, this.candleHealth - candleDrain);
        this.candleFill.style.width = `${this.candleHealth}%`;

        if (this.candleHealth <= 0) {
            this.candleText.textContent = 'PADAM! (BAHAYA!)';
            this.candleText.style.color = '#ff2222';
            this.candleExtinguishedTimer += 0.1;

            // If candle unlit for 12 seconds, contestant is possessed!
            if (this.candleExtinguishedTimer >= 12) {
                this.triggerGameOver('Peserta Uji Nyali di CAM 05 kesurupan hebat karena lilin padam! Mahluk gaib menguasai seluruh area siaran.');
            }
        } else if (this.candleHealth < 35) {
            this.candleText.textContent = 'BERKEDIP LEMAH';
            this.candleText.style.color = '#f8c028';
            this.candleExtinguishedTimer = 0;
        } else {
            this.candleText.textContent = 'MENYALA';
            this.candleText.style.color = '#25f46b';
            this.candleExtinguishedTimer = 0;
        }
    }

    renderUsageBars(count) {
        const pips = this.usageBars.querySelectorAll('.usage-pip');
        pips.forEach((pip, idx) => {
            if (idx < count) {
                pip.className = count >= 4 ? 'usage-pip active high' : 'usage-pip active';
            } else {
                pip.className = 'usage-pip';
            }
        });
    }

    // Doors & Lights Controls
    toggleDoor(side) {
        if (!this.inGame || this.isBlackout) return;

        if (side === 'left') {
            this.doorLeft = !this.doorLeft;
            this.shutterLeft.classList.toggle('closed', this.doorLeft);
            this.btnDoorLeft.classList.toggle('closed', this.doorLeft);
            this.textDoorLeft.textContent = this.doorLeft ? 'TUTUP' : 'BUKA';
            window.audioMgr.playDoorSlam(this.doorLeft);
        } else {
            this.doorRight = !this.doorRight;
            this.shutterRight.classList.toggle('closed', this.doorRight);
            this.btnDoorRight.classList.toggle('closed', this.doorRight);
            this.textDoorRight.textContent = this.doorRight ? 'TUTUP' : 'BUKA';
            window.audioMgr.playDoorSlam(this.doorRight);
        }
    }

    toggleLight(side) {
        if (!this.inGame || this.isBlackout) return;

        if (side === 'left') {
            this.lightLeft = !this.lightLeft;
            this.btnLightLeft.classList.toggle('active', this.lightLeft);
            document.getElementById('text-light-left').textContent = this.lightLeft ? 'MENYALA' : 'MATI';
            window.audioMgr.playLightSwitch(this.lightLeft);

            // Show spotlight if on and Pocong is at Door (Location 99)
            if (this.lightLeft && this.pocongLocation === 99) {
                this.spotlightLeft.classList.add('active');
                window.audioMgr.playHeartbeat();
            } else {
                this.spotlightLeft.classList.remove('active');
            }
        } else {
            this.lightRight = !this.lightRight;
            this.btnLightRight.classList.toggle('active', this.lightRight);
            document.getElementById('text-light-right').textContent = this.lightRight ? 'MENYALA' : 'MATI';
            window.audioMgr.playLightSwitch(this.lightRight);

            // Show spotlight if on and Kunti is at Door (Location 99)
            if (this.lightRight && this.kuntiLocation === 99) {
                this.spotlightRight.classList.add('active');
                window.audioMgr.playHeartbeat();
            } else {
                this.spotlightRight.classList.remove('active');
            }
        }
    }

    updateDoorUI() {
        this.shutterLeft.classList.toggle('closed', this.doorLeft);
        this.shutterRight.classList.toggle('closed', this.doorRight);
        this.spotlightLeft.classList.remove('active');
        this.spotlightRight.classList.remove('active');
        this.btnLightLeft.classList.remove('active');
        this.btnLightRight.classList.remove('active');
        this.textDoorLeft.textContent = 'BUKA';
        this.textDoorRight.textContent = 'BUKA';
        document.getElementById('text-light-left').textContent = 'MATI';
        document.getElementById('text-light-right').textContent = 'MATI';
    }

    // CCTV Controls
    toggleCCTV() {
        if (!this.inGame || this.isBlackout) return;

        this.cctvOpen = !this.cctvOpen;
        window.audioMgr.playCameraSwitch();

        if (this.cctvOpen) {
            this.screenCctv.classList.add('active');
            this.screenOffice.classList.remove('active');
            this.switchCamera(this.currentCam);
        } else {
            this.screenCctv.classList.remove('active');
            this.screenOffice.classList.add('active');
        }
    }

    switchCamera(camNum) {
        this.currentCam = camNum;
        window.audioMgr.playCameraSwitch();

        // Update Cam Buttons
        this.camButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.cam, 10) === camNum);
        });

        // Update Camera Label & Image
        this.cctvCameraName.textContent = this.cameraNames[camNum];
        this.cctvImage.src = this.cameraImages[camNum];

        // Contestant Panel Visibility on CAM 05
        this.participantPanel.style.display = camNum === 5 ? 'flex' : 'none';

        // Check if ghost is in this room and play subtle cue
        if (camNum === 4 && this.pocongLocation === 4) {
            // Pocong under banyan tree
        } else if (camNum === this.kuntiLocation) {
            window.audioMgr.playKuntiAudioCue();
        } else if (camNum === this.genderuwoLocation) {
            window.audioMgr.playGenderuwoGrowl();
        }
    }

    relightCandle() {
        if (!this.inGame || this.candleHealth >= 95) return;
        this.candleHealth = 100.0;
        window.audioMgr.playGamelanStinger();
        window.audioMgr.playWalkieTalkie();
    }

    triggerAudioDistract() {
        if (!this.inGame || this.battery < 5) return;
        window.audioMgr.playWalkieTalkie();
        window.audioMgr.playStaticBurst(0.5, 0.4);

        // Lure ghosts to current camera
        if (this.currentCam === 4) {
            // Lure Pocong back to Banyan tree
            if (this.pocongLocation === 1 || this.pocongLocation === 6) {
                this.pocongLocation = 4;
            }
            // Lure Genderuwo to Banyan tree
            if (this.genderuwoLocation === 8) {
                this.genderuwoLocation = 2;
            }
        } else if (this.currentCam === 1) {
            if (this.pocongLocation === 6) this.pocongLocation = 1;
            if (this.kuntiLocation === 7) this.kuntiLocation = 5;
        }
    }

    surrenderLambaikanTangan() {
        if (!this.inGame) return;
        this.inGame = false;
        clearInterval(this.clockInterval);
        clearInterval(this.gameLoopInterval);

        window.audioMgr.playWalkieTalkie();
        alert('"PESERTA / OPERATOR TELAH MELAMBAIKAN TANGAN KE KAMERA!\nTIM MEDIS DAN KRU PRODUKSI DUNIA LAIN SEGERA MEMASUKI LOKASI UNTUK EVAKUASI!"\n\nUji Nyali dinyatakan selesai atas permintaan kru.');
        this.showTitleScreen();
    }

    // Ghost Movement & AI Logic
    setupGhostAISchedules() {
        // AI Difficulty Speed based on Night
        const pocongInterval = Math.max(4500, 9000 - this.night * 1500);
        const kuntiInterval = Math.max(5500, 10000 - this.night * 1500);
        const genderuwoInterval = Math.max(10000, 16000 - this.night * 2000);

        // Pocong Movement Loop
        const pocongLoop = () => {
            if (!this.inGame || this.isBlackout) return;
            this.movePocong();
            setTimeout(pocongLoop, pocongInterval + Math.random() * 2500);
        };
        setTimeout(pocongLoop, 6000);

        // Kuntilanak Movement Loop
        const kuntiLoop = () => {
            if (!this.inGame || this.isBlackout) return;
            this.moveKuntilanak();
            setTimeout(kuntiLoop, kuntiInterval + Math.random() * 3000);
        };
        setTimeout(kuntiLoop, 8000);

        // Genderuwo Movement Loop
        const genderuwoLoop = () => {
            if (!this.inGame || this.isBlackout) return;
            this.moveGenderuwo();
            setTimeout(genderuwoLoop, genderuwoInterval + Math.random() * 4000);
        };
        setTimeout(genderuwoLoop, 12000);
    }

    movePocong() {
        // Path: 4 (Beringin) -> 1 (Lorong) -> 6 (Sayap Kiri) -> 99 (Pintu Kiri)
        if (this.pocongLocation === 4) {
            this.pocongLocation = 1;
            window.audioMgr.playPocongHop();
        } else if (this.pocongLocation === 1) {
            this.pocongLocation = 6;
            window.audioMgr.playPocongHop();
        } else if (this.pocongLocation === 6) {
            // At the Left Door!
            this.pocongLocation = 99;
            window.audioMgr.playPocongHop();

            // If door is already closed, bounce back
            if (this.doorLeft) {
                window.audioMgr.playDoorSlam(false);
                this.pocongLocation = 4;
            } else {
                // Pocong is waiting at the open door!
                // Give player grace time to close door
                setTimeout(() => {
                    if (this.inGame && this.pocongLocation === 99) {
                        if (this.doorLeft) {
                            // Player saved themselves!
                            this.pocongLocation = 4;
                            this.spotlightLeft.classList.remove('active');
                        } else {
                            // Jumpscare Pocong!
                            this.triggerJumpscare('pocong');
                        }
                    }
                }, this.pocongDoorGraceMs);
            }
        } else if (this.pocongLocation === 99) {
            if (this.doorLeft) {
                this.pocongLocation = 4;
                this.spotlightLeft.classList.remove('active');
            }
        }
    }

    moveKuntilanak() {
        // Path: 3 (Surgery) -> 5 (Participant) -> 7 (Sayap Kanan) -> 99 (Pintu Kanan)
        if (this.kuntiLocation === 3) {
            this.kuntiLocation = 5;
            window.audioMgr.playKuntiAudioCue();
        } else if (this.kuntiLocation === 5) {
            this.kuntiLocation = 7;
            window.audioMgr.playKuntiAudioCue();
        } else if (this.kuntiLocation === 7) {
            // At Right Door!
            this.kuntiLocation = 99;
            window.audioMgr.playKuntiAudioCue();

            if (this.doorRight) {
                window.audioMgr.playDoorSlam(false);
                this.kuntiLocation = 3;
            } else {
                // Give player grace time to close door
                setTimeout(() => {
                    if (this.inGame && this.kuntiLocation === 99) {
                        if (this.doorRight) {
                            this.kuntiLocation = 3;
                            this.spotlightRight.classList.remove('active');
                        } else {
                            this.triggerJumpscare('kuntilanak');
                        }
                    }
                }, this.kuntiDoorGraceMs);
            }
        } else if (this.kuntiLocation === 99) {
            if (this.doorRight) {
                this.kuntiLocation = 3;
                this.spotlightRight.classList.remove('active');
            }
        }
    }

    moveGenderuwo() {
        // Genderuwo stalks CAM 2 (Morgue) or CAM 8 (Generator)
        if (this.genderuwoLocation === 2) {
            this.genderuwoLocation = 8;
            window.audioMgr.playGenderuwoGrowl();
            window.audioMgr.playStaticBurst(0.4, 0.4);
        } else if (this.genderuwoLocation === 8) {
            // Draining battery, occasionally retreats
            if (Math.random() > 0.4) {
                this.genderuwoLocation = 2;
            }
        }
    }

    // Blackout sequence when battery reaches 0%
    triggerBlackout() {
        this.isBlackout = true;
        this.doorLeft = false;
        this.doorRight = false;
        this.lightLeft = false;
        this.lightRight = false;
        this.cctvOpen = false;

        this.shutterLeft.classList.remove('closed');
        this.shutterRight.classList.remove('closed');
        this.screenCctv.classList.remove('active');
        this.screenOffice.classList.add('active');
        this.blackoutScreen.classList.add('active');

        // Play blackout sound
        window.audioMgr.playDoorSlam(false);
        window.audioMgr.playStaticBurst(1.0, 0.6);

        // Waiting in total darkness... then jumpscare!
        setTimeout(() => {
            if (this.inGame) {
                window.audioMgr.playGamelanStinger();
            }
        }, 2000);

        setTimeout(() => {
            if (this.inGame) {
                this.triggerJumpscare('blackout');
            }
        }, 5500);
    }

    // Terrifying Jump Scare Trigger
    triggerJumpscare(ghostType) {
        if (!this.inGame) return;
        this.inGame = false;
        clearInterval(this.clockInterval);
        clearInterval(this.gameLoopInterval);

        // Close CCTV if open
        this.screenCctv.classList.remove('active');
        this.screenOffice.classList.remove('active');
        this.blackoutScreen.classList.remove('active');

        // Set Jumpscare Graphic
        if (ghostType === 'pocong' || ghostType === 'blackout') {
            this.jumpscareImage.src = 'assets/images/jumpscare_pocong.jpg';
        } else {
            this.jumpscareImage.src = 'assets/images/door_right_kunti.jpg';
        }

        this.screenJumpscare.classList.add('active');
        window.audioMgr.playJumpScare();

        setTimeout(() => {
            this.screenJumpscare.classList.remove('active');
            let reason = 'Mahluk gaib berhasil menerobos masuk ke pos pantau Anda!';
            if (ghostType === 'pocong') reason = 'Pocong melompat masuk lewat pintu kiri yang tidak sempat Anda tutup!';
            if (ghostType === 'kuntilanak') reason = 'Kuntilanak melayang menembus pintu kanan saat Anda lengah!';
            if (ghostType === 'blackout') reason = 'Daya Aki genset habis (0%). Kegelapan total mengundang mahluk gaib langsung ke meja Anda!';
            this.triggerGameOver(reason);
        }, 2000);
    }

    triggerGameOver(reason) {
        this.gameoverReason.textContent = reason;
        this.screenGameOver.classList.add('active');
    }

    victory() {
        this.inGame = false;
        clearInterval(this.clockInterval);
        clearInterval(this.gameLoopInterval);

        this.screenCctv.classList.remove('active');
        this.screenOffice.classList.remove('active');
        this.screenWin.classList.add('active');

        window.audioMgr.playVictoryChime();
    }
}

// Instantiate game on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new DuniaLainGame();
});
