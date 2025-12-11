const { createApp, ref } = Vue;

const PC_HASH = "7e8bb5a89f2842ac4af01b3b7e228592";
const MOBILE_HASH = "7a990d405d2c6fb93aa8fbb0ec1a3b23";
const SALT = "af0ik392jrmt0nsfdghy0";
const SPLITTER = "Fe12NAfA3R6z4k0z";

const DEFAULT_SAVE = {
    creationTimestamp: Date.now(),
    uniqueId: "",
    email: "",
    rubies: 99999,
    gold: { numBase: 1, numPower: 100 },
    heroSouls: { numBase: 1, numPower: 50 },
    ancientSouls: 1000,
    highestFinishedZone: 5000,
    transcendentHighestFinishedZone: 5000,
    totalMoneySpent: 999,
    isCheater: false,
    transcendent: true,
    autoclickers: 10,
    dlcAutoclickers: 5,
    candyCanes: 100,
    spikedNog: 100,
    labelMakers: 50,
    forgeCoals: 50,
    unopenedClickmasPresents: 1000,
    account: { name: "CHSE User" },
    heroCollection: { heroes: {} },
    ancients: { ancients: {} },
    outsiders: { outsiders: {} },
    mercenaries: { mercenaries: {} },
    items: { items: {}, slots: {} },
    stats: {},
    achievements: {},
    upgrades: {},
    autoclickerSkins: { "1": true }
};

for (let i = 1; i <= 200; i++) {
    DEFAULT_SAVE.heroCollection.heroes[i] = { id: i, level: 0, epicLevel: 0, locked: i !== 1, uid: i };
}
for (let i = 1; i <= 100; i++) {
    DEFAULT_SAVE.ancients.ancients[i] = { id: i, level: { numBase: 0, numPower: 0 }, locked: false, uid: i };
}
for (let i = 1; i <= 30; i++) {
    DEFAULT_SAVE.outsiders.outsiders[i] = { id: i, level: 0 };
}

createApp({
    setup() {
        const currentTab = ref('general');
        const saveData = ref(null);
        const inputSaveData = ref('');
        const saveFormat = ref('pc'); // 'pc' or 'mobile'

        const toasts = ref([]);

        const showToast = (message, type = 'info') => {
            const id = Date.now() + Math.random();
            toasts.value.push({ id, message, type });
            setTimeout(() => {
                removeToast(id);
            }, 3000);
        };

        const removeToast = (id) => {
            toasts.value = toasts.value.filter(t => t.id !== id);
        };

        const staticItemBonuses = (typeof STATIC_DATA !== 'undefined' && STATIC_DATA.itemBonuses) ? STATIC_DATA.itemBonuses : {};

        const getStaticName = (category, id) => {
            if (typeof STATIC_DATA !== 'undefined' && STATIC_DATA[category] && STATIC_DATA[category][id]) {
                return STATIC_DATA[category][id];
            }
            return `ID: ${id}`;
        };

        const imgError = (e) => {
            const src = e.target.src;
            if (src.includes('.webp')) {
                e.target.src = src.replace('.webp', '.png');
            } else {
                e.target.style.display = 'none';
            }
        };

        const processInputData = () => {
            if (!inputSaveData.value) return;
            const cleanInput = inputSaveData.value.trim();
            let detectedFormat = 'pc';

            try {
                let json = null;

                if (cleanInput.startsWith(PC_HASH)) {
                    // PC Format: Hash + Base64(RawDeflate)
                    try {
                        const body = cleanInput.slice(PC_HASH.length);
                        const binaryString = atob(body);
                        const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
                        const decompressed = pako.inflate(bytes, { to: 'string', raw: true });
                        json = JSON.parse(decompressed);
                        detectedFormat = 'pc';
                    } catch (e) {
                        console.error(e);
                    }
                }
                else if (cleanInput.startsWith(MOBILE_HASH)) {
                    // Mobile Format: Hash + Base64(Zlib)
                    try {
                        const body = cleanInput.slice(MOBILE_HASH.length);
                        const binaryString = atob(body);
                        const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
                        const decompressed = pako.inflate(bytes, { to: 'string' }); // standard zlib
                        json = JSON.parse(decompressed);
                        detectedFormat = 'mobile';
                    } catch (e) {
                        throw new Error("Mobile形式の解凍に失敗: " + e.message);
                    }
                }
                else if (cleanInput.includes(SPLITTER)) {
                    const parts = cleanInput.split(SPLITTER);
                    const body = unsprinkle(parts[0]);
                    const binaryString = atob(body);
                    json = JSON.parse(binaryString);
                }
                else if (cleanInput.startsWith("{")) {
                    json = JSON.parse(cleanInput);
                }

                if (json) {
                    saveData.value = json;
                    saveFormat.value = detectedFormat;
                    currentTab.value = 'general';
                    showToast(`読み込み成功 (${detectedFormat.toUpperCase()}形式)`, 'success');
                } else {
                    showToast('形式不明のデータです', 'error');
                }
            } catch (e) {
                console.error(e);
                showToast('読込エラー: ' + e.message, 'error');
            }
        };

        const createNewSave = () => {
            const newSave = JSON.parse(JSON.stringify(DEFAULT_SAVE));
            newSave.creationTimestamp = Date.now();
            newSave.uniqueId = "chse_" + Date.now();
            saveData.value = newSave;
            showToast("新規データを作成しました。", 'success');
        };

        const unsprinkle = (data) => {
            let result = "";
            for (let i = 0; i < data.length; i += 2) result += data[i];
            return result;
        };

        const encode = () => {
            try {
                // ディープコピーして編集（画面表示に影響を与えないため）
                const dataToSave = JSON.parse(JSON.stringify(saveData.value));
                let resultHash = "";
                let compressed = null;

                if (saveFormat.value === 'mobile') {
                    // === Mobile変換 ===
                    dataToSave.saveOrigin = "mobile";
                    // バージョン番号の調整 (例: 2.7.0 -> 1.0e12)
                    let ver = dataToSave.readPatchNumber || "1.0e12";
                    if (!ver.includes("1.0e12")) {
                         // 末尾のビルド番号などがあれば維持
                         const suffix = ver.includes('.') ? ver.split('.').pop() : "";
                         dataToSave.readPatchNumber = "1.0e12-" + (suffix.length > 0 ? suffix : "0");
                    }
                    
                    const jsonStr = JSON.stringify(dataToSave);
                    compressed = pako.deflate(jsonStr); // standard zlib
                    resultHash = MOBILE_HASH;
                } else {
                    // === PC変換 ===
                    dataToSave.saveOrigin = "pc";
                    // バージョン番号の調整 (例: 1.0e12 -> 2.7.0)
                    let ver = dataToSave.readPatchNumber || "2.7.0";
                    if (ver.includes("1.0e12")) {
                        dataToSave.readPatchNumber = "2.7.0";
                    }

                    const jsonStr = JSON.stringify(dataToSave);
                    compressed = pako.deflate(jsonStr, { raw: true, level: 9 }); // raw deflate
                    resultHash = PC_HASH;
                }

                const binaryString = String.fromCharCode(...compressed);
                return resultHash + btoa(binaryString);
            } catch (e) {
                console.error(e);
                showToast("保存エラー: " + e.message, 'error');
                return null;
            }
        };

        const importFile = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                inputSaveData.value = e.target.result;
                processInputData();
            };
            reader.readAsText(file);
        };

        const triggerFileInput = () => document.getElementById('fileInput').click();

        const exportSave = () => {
            const newSave = encode();
            if (newSave) {
                const blob = new Blob([newSave], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `clicker_heroes_save_${saveFormat.value}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                showToast(`セーブファイルをダウンロードしました (${saveFormat.value.toUpperCase()})`, 'success');
            }
        };

        // --- Helper Functions ---
        const parseBigNum = (bn) => {
            if (!bn) return "0";
            if (typeof bn === 'string') return bn;
            if (typeof bn === 'number') return bn.toString();
            let base = bn.numBase;
            if (typeof base === 'number') base = Math.round(base * 1000) / 1000;
            return `${base}e${bn.numPower}`;
        };

        const updateBigNum = (target, event) => {
            const val = event.target.value.toLowerCase();
            let base = 0, power = 0;
            if (val.includes('e')) {
                const parts = val.split('e');
                base = parseFloat(parts[0]);
                power = parseFloat(parts[1]);
            } else {
                base = parseFloat(val);
                power = 0;
                if (!isNaN(base) && base !== 0) {
                    while (Math.abs(base) >= 10) { base /= 10; power++; }
                    while (Math.abs(base) < 1 && base !== 0) { base *= 10; power--; }
                }
            }
            if (isNaN(base) || isNaN(power)) return;
            const newVal = { numBase: base, numPower: power };

            if (target === 'gold') saveData.value.gold = newVal;
            if (target === 'heroSouls') saveData.value.heroSouls = newVal;
            if (target === 'titanDamage') saveData.value.titanDamage = newVal;
        };

        const updateItemBigNum = (item, field, event) => {
            const val = event.target.value.toLowerCase();
            let base = 0, power = 0;
            if (val.includes('e')) {
                const parts = val.split('e');
                base = parseFloat(parts[0]);
                power = parseFloat(parts[1]);
            } else {
                base = parseFloat(val);
                power = 0;
            }
            item[field] = { numBase: base, numPower: power };
        };

        const updateAncientLevel = (ancient, event) => {
            const val = event.target.value.toLowerCase();
            let base = 0, power = 0;
            if (val.includes('e')) {
                const parts = val.split('e');
                base = parseFloat(parts[0]);
                power = parseFloat(parts[1]);
            } else {
                base = parseFloat(val);
                power = 0;
            }
            ancient.level = { numBase: base, numPower: power };
        };

        const removeCheatFlag = () => {
            saveData.value.isCheater = false;
            showToast('チーターフラグを解除しました', 'success');
        };

        const unlockAllSkins = () => {
            if (!saveData.value.autoclickerSkins) saveData.value.autoclickerSkins = {};
            for (let i = 1; i <= 20; i++) saveData.value.autoclickerSkins[i] = true;
            showToast('全スキンを解放しました', 'success');
        };

        const gildAll = (targetId) => {
            for (const id in saveData.value.heroCollection.heroes) {
                saveData.value.heroCollection.heroes[id].epicLevel = 0;
            }
            showToast('全ギルドをリセットしました', 'info');
        };

        const maxLevels = () => {
            for (const id in saveData.value.heroCollection.heroes) {
                saveData.value.heroCollection.heroes[id].level = 10000;
                saveData.value.heroCollection.heroes[id].locked = false;
            }
            showToast('全ヒーローをLv10000にし、ロック解除しました', 'success');
        };

        const toggleUpgrade = (hero, upgradeId) => {
            if (!saveData.value.upgrades) saveData.value.upgrades = {};
            if (saveData.value.upgrades[upgradeId]) {
                delete saveData.value.upgrades[upgradeId];
            } else {
                saveData.value.upgrades[upgradeId] = true;
            }
        };

        const buyAllUpgrades = (heroId) => {
            if (!saveData.value.upgrades) saveData.value.upgrades = {};
            const heroData = STATIC_DATA.heroes[heroId];
            if (heroData && heroData.upgrades) {
                heroData.upgrades.forEach(u => {
                    saveData.value.upgrades[u.id] = true;
                });
            }
            showToast('アップグレードを全て購入済みにしました', 'success');
        };

        const buyAllUpgradesGlobal = () => {
            if (!saveData.value.upgrades) saveData.value.upgrades = {};
            for (const heroId in STATIC_DATA.heroes) {
                const heroData = STATIC_DATA.heroes[heroId];
                if (heroData.upgrades) {
                    heroData.upgrades.forEach(u => {
                        saveData.value.upgrades[u.id] = true;
                    });
                }
            }
            showToast('全ヒーローのアップグレードを解放しました', 'success');
        };

        const hasUpgrade = (upgradeId) => {
            return saveData.value.upgrades && saveData.value.upgrades[upgradeId];
        };

        const reviveMerc = (merc) => {
            merc.timeToDie = 86400000;
            showToast(`${merc.name || '傭兵'} を復活させました`, 'success');
        };

        const makeImmortal = (merc) => {
            merc.timeToDie = 2147483647;
            showToast(`${merc.name || '傭兵'} を不死化しました`, 'success');
        };

        return {
            currentTab,
            saveData,
            inputSaveData,
            saveFormat,
            processInputData,
            createNewSave,
            importFile,
            triggerFileInput,
            exportSave,
            parseBigNum,
            updateBigNum,
            updateItemBigNum,
            updateAncientLevel,
            toggleUpgrade,
            buyAllUpgrades,
            buyAllUpgradesGlobal,
            hasUpgrade,
            removeCheatFlag,
            unlockAllSkins,
            gildAll,
            maxLevels,
            reviveMerc,
            makeImmortal,
            getStaticName,
            imgError,
            staticItemBonuses,
            toasts,
            removeToast
        };
    }
}).mount('#app');
