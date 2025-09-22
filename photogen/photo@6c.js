// photo.js 檔案的頂部

import { setDoc} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// 將 Firebase 設定直接定義在程式碼內 //匿名使用不須隱藏
const __firebase_config = `{
    "apiKey": "AIzaSyD5Qk5UrYr2nZHwvP5v_x_p9URBXxsEQ1w",
    "authDomain": "project1-65fd2.firebaseapp.com",
    "projectId": "project1-65fd2",
    "storageBucket": "project1-65fd2.firebasestorage.app",
    "messagingSenderId": "1092092998314",
    "appId": "1:1092092998314:web:82615aa69da6897ccb16d3",
    "measurementId": "G-2QX78R2CST"
}`;

const __app_id = "1:1092092998314:web:82615aa69da6897ccb16d3";

let db, auth;
let __initial_auth_token;

window.onload = function() {
    //__app_id = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
   // __initial_auth_token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

    // 檢查 firebaseConfig 是否有值，這代表 Canvas 是否成功提供了設定。
    // 如果沒有設定，代表我們處於離線或非 Firebase 環境，應用程式仍可執行，
    // 但不會連線到資料庫。
    if (Object.keys(firebaseConfig).length > 0) {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        if (__initial_auth_token) {
            signInWithCustomToken(auth, __initial_auth_token).then(() => {
                console.log("已使用自訂權杖登入 Firebase");
            }).catch((error) => {
                console.error("自訂權杖登入失敗: ", error);
                signInAnonymously(auth).then(() => {
                    console.log("已匿名登入 Firebase (備用)");
                }).catch((error) => {
                    console.error("匿名登入失敗: ", error);
                });
            });
        } else {
            signInAnonymously(auth).then(() => {
                console.log("已匿名登入 Firebase");
            }).catch((error) => {
                console.error("匿名登入失敗: ", error);
            });
        }
    } else {
        console.error("Firebase 配置缺失，請確認 Canvas 變數是否正確提供。");
    }
}
window.addEventListener('beforeunload', (event) => {
    // 檢查是否有上傳任何照片
    // 這裡假設 photoData.length > 1 或 photoData[0].image 存在時表示有照片
    const hasUploadedPhotos = photoData.some(p => p.image);

    if (hasUploadedPhotos) {
        // 舊版瀏覽器需要設定 returnValue 屬性
        event.returnValue = '您的照片尚未儲存，確定要離開嗎？';
        
        // 對於現代瀏覽器，返回字串即可觸發確認框
        return '您的照片尚未儲存，確定要離開嗎？';
    }
});

const classNameInput = document.getElementById('className');
const photoInputsContainer = document.getElementById('photoInputsContainer');
const addPhotoBlock = document.getElementById('addPhotoBlock');
const combineBtn = document.getElementById('combineBtn');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const finalImage = document.getElementById('finalImage');

const signatureCanvas = document.getElementById('signatureCanvas');
const signatureCtx = signatureCanvas.getContext('2d');
const enableSignatureBtn = document.getElementById('enableSignatureBtn');
const clearSignatureBtn = document.getElementById('clearSignatureBtn');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeButton = document.querySelector('.close-button');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let signatureDrawn = false;

const MAX_PHOTOS = 8;
let photoData = []; 

const defaultTexts = [
    "櫃台",
    "麵包",
    "泡麵",
    "零食",
    "啤酒",
    "落地",
    "騎樓",
];

function createPhotoInputBlock(index) {
    const div = document.createElement('div');
    div.className = 'photo-uploader';
    div.setAttribute('data-index', index);
    
    if (index > 0) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.setAttribute('title', '刪除');
        deleteButton.innerHTML = '&times;';
        div.appendChild(deleteButton);
    }

    const photoLabel = document.createElement('label');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'photo-input';
    fileInput.accept = 'image/*';
    fileInput.capture = 'camera';
    fileInput.id = `photo-input-${index}`;
    div.appendChild(fileInput); 

    const photoAlert = document.createElement('span');
    photoAlert.className = 'photo-alert hidden';
    photoAlert.textContent = '請上傳照片！';

    const previewContainer = document.createElement('div');
    previewContainer.className = 'photo-preview-container';
    // 使用 Unicode 相機圖示和文字，將它們包在一個新的 span 裡面
    previewContainer.innerHTML = `
    <span class="photo-preview-content">
        <span class="camera-icon">📸</span>
        <span class="photo-preview-text">點擊選擇檔案</span>
    </span>
    `;

    const textLabel = document.createElement('label');
    textLabel.textContent = `區域 ${index + 1}(可空白):`;
    const textInput = document.createElement('input');
    textInput.setAttribute('list', 'textSuggestions');
    textInput.type = 'text';
    textInput.className = 'text-input';
    textInput.placeholder = '請輸入或選擇文字(右側可下拉選擇)';
    
    div.appendChild(photoLabel);
    div.appendChild(textLabel);
    div.appendChild(textInput);
    div.appendChild(photoAlert);
    div.appendChild(previewContainer);

    photoInputsContainer.insertBefore(div, addPhotoBlock);
}

function createDatalist() {
    const datalist = document.createElement('datalist');
    datalist.id = 'textSuggestions';
    defaultTexts.forEach(text => {
        const option = document.createElement('option');
        option.value = text;
        datalist.appendChild(option);
    });
    document.body.appendChild(datalist);
}

function checkAddButtonVisibility() {
    if (photoData.length >= MAX_PHOTOS) {
        addPhotoBlock.classList.add('hidden');
    } else {
        addPhotoBlock.classList.remove('hidden');
    }
}

createDatalist();

createPhotoInputBlock(0);
photoData.push({});
checkAddButtonVisibility();

function hideAllAlerts() {
    document.querySelectorAll('.photo-alert').forEach(alert => {
        alert.classList.add('hidden');
    });
}

addPhotoBlock.addEventListener('click', () => {
    hideAllAlerts();

    if (photoData.length >= MAX_PHOTOS) {
        const lastBlock = document.querySelector(`.photo-uploader[data-index="${photoData.length - 1}"]`);
        if (lastBlock) {
            const alertElement = lastBlock.querySelector('.photo-alert');
            alertElement.textContent = '最多只能新增 8 張照片！';
            alertElement.classList.remove('hidden');
        }
        return;
    }
    
    // 如果前一個區塊沒有照片，則給予提示，不新增
    const lastPhotoData = photoData[photoData.length - 1];
    if (!lastPhotoData.image && photoData.length > 0) { // 確保不是第一個區塊
        const lastBlock = document.querySelector(`.photo-uploader[data-index="${photoData.length - 1}"]`);
        if (lastBlock) {
            const alertElement = lastBlock.querySelector('.photo-alert');
            alertElement.textContent = '請先上傳照片！';
            alertElement.classList.remove('hidden');
            setTimeout(() => {
                lastBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        return;
    }

    const newIndex = photoData.length;
    createPhotoInputBlock(newIndex);
    photoData.push({});
    checkAddButtonVisibility();

    const newBlock = document.querySelector(`.photo-uploader[data-index="${newIndex}"]`);
    if (newBlock) {
        setTimeout(() => {
            // 自動點擊新的檔案選擇輸入框
            const newFileInput = newBlock.querySelector('.photo-input');
            if (newFileInput) {
                newFileInput.click();
            }
        }, 100);
    }
});

// 取得警告橫幅元素
const warningBanner = document.getElementById('warningBanner');
const closeWarningBtn = document.querySelector('.warning-banner .close-btn');

// 新增一個變數，追蹤橫幅是否已經顯示過
let bannerHasBeenShown = false;

// 為關閉按鈕添加點擊事件監聽器
closeWarningBtn.addEventListener('click', () => {
    warningBanner.style.display = 'none';
});

photoInputsContainer.addEventListener('change', async (e) => {
    if (e.target.classList.contains('photo-input')) {
        const block = e.target.closest('.photo-uploader');
        const index = parseInt(block.dataset.index);
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    photoData[index].image = img;
                    block.querySelector('.photo-alert').classList.add('hidden');
                    
                    if (!bannerHasBeenShown) {
                        warningBanner.style.display = 'block';
                        bannerHasBeenShown = true;
                    }

                    const previewContainer = block.querySelector('.photo-preview-container');
                    previewContainer.innerHTML = ''; // 清空原有內容

                    const previewImg = document.createElement('img');
                    previewImg.className = 'photo-preview-image'; // 使用新的 class 名稱
                    previewImg.src = e.target.result;
                    previewContainer.appendChild(previewImg);

                    // 新增 RETAKE 提示層
                    const retakeOverlay = document.createElement('div');
                    retakeOverlay.className = 'photo-retake-overlay';
                    retakeOverlay.innerHTML = '<span class="camera-icon">📸</span> RETAKE';
                    previewContainer.appendChild(retakeOverlay);
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);

            setTimeout(() => {
                block.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center', 
                    inline: 'nearest'
                });
            }, 100);
        }
    }

    if (e.target.classList.contains('text-input')) {
        e.target.blur();
    }
});

photoInputsContainer.addEventListener('click', (e) => {
    const previewContainer = e.target.closest('.photo-preview-container');
    if (previewContainer) {
        const fileInput = previewContainer.parentElement.querySelector('.photo-input');
        if (fileInput) {
            fileInput.click();
        }
    }
});

classNameInput.addEventListener('change', (e) => {
    e.target.blur();
});

photoInputsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const block = e.target.closest('.photo-uploader');
        const index = parseInt(block.dataset.index);
        
        block.remove();

        photoData.splice(index, 1);
        hideAllAlerts();

        const photoBlocks = document.querySelectorAll('.photo-uploader');
        photoBlocks.forEach((el, i) => {
            el.dataset.index = i;
            el.querySelector('label:nth-of-type(2)').textContent = `區域 ${i + 1}(可空白):`;
            
            const fileInput = el.querySelector('.photo-input');
            fileInput.id = `photo-input-${i}`;
        });
        checkAddButtonVisibility();
    }
});

function getClientCoordinates(event) {
    if (event.touches && event.touches.length > 0) {
        return {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }
    return {
        x: event.clientX,
        y: event.clientY
    };
}

// 繪製提示文字
function drawHintText(text) {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureCtx.fillStyle = '#888';
    signatureCtx.font = '20px Arial';
    signatureCtx.textAlign = 'center';
    signatureCtx.textBaseline = 'middle';
    signatureCtx.fillText(text, signatureCanvas.width / 2, signatureCanvas.height / 2);
}

// 啟用/禁用簽名繪製
function toggleDrawing(enable) {
    const drawingEvents = {
        'mousedown': startDrawing,
        'mouseup': stopDrawing,
        'mouseout': stopDrawing,
        'mousemove': draw,
        'touchstart': (e) => { e.preventDefault(); startDrawing(e); },
        'touchend': stopDrawing,
        'touchcancel': stopDrawing,
        'touchmove': (e) => { e.preventDefault(); draw(e); }
    };

    if (enable) {
        for (let event in drawingEvents) {
            signatureCanvas.addEventListener(event, drawingEvents[event], { passive: false });
        }
        signatureCanvas.classList.remove('disabled');
        signatureCanvas.classList.add('active');
        
        // 新增: 啟用時，將「啟用簽名」按鈕變為灰色並禁用
        enableSignatureBtn.classList.add('button-disabled');
        enableSignatureBtn.disabled = true;

        if(!signatureDrawn) {
            drawHintText('開始簽名');
        }
    } else {
        for (let event in drawingEvents) {
            signatureCanvas.removeEventListener(event, drawingEvents[event]);
        }
        signatureCanvas.classList.remove('active');
        signatureCanvas.classList.add('disabled');
        
        // 新增: 禁用時，將「啟用簽名」按鈕恢復正常
        enableSignatureBtn.classList.remove('button-disabled');
        enableSignatureBtn.disabled = false;
        
        drawHintText('點擊「啟用簽名」開始');
    }
}

function draw(event) {
    if (!isDrawing) return;

    const rect = signatureCanvas.getBoundingClientRect();
    const clientCoords = getClientCoordinates(event);
    const x = (clientCoords.x - rect.left) / rect.width * signatureCanvas.width;
    const y = (clientCoords.y - rect.top) / rect.height * signatureCanvas.height;

    signatureCtx.beginPath();
    signatureCtx.moveTo(lastX, lastY);
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
    [lastX, lastY] = [x, y];
    signatureDrawn = true;
}

function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const clientCoords = getClientCoordinates(e);
    lastX = (clientCoords.x - rect.left) / rect.width * signatureCanvas.width;
    lastY = (clientCoords.y - rect.top) / rect.height * signatureCanvas.height;
    
    // 只有當畫布上沒有內容時才清除提示文字
    if (!signatureDrawn) {
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    }
    
    signatureCtx.beginPath(); 
    signatureCtx.moveTo(lastX, lastY); 
}

function stopDrawing() {
    isDrawing = false;
}

function clearSignature() {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureDrawn = false;
    toggleDrawing(false); 
}

function initSignatureCanvas() {
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCanvas.width = rect.width;
    signatureCanvas.height = rect.height;
    
    signatureCtx.lineWidth = 3;
    signatureCtx.lineCap = 'round';
    signatureCtx.strokeStyle = 'black';
    signatureCtx.imageSmoothingEnabled = true;

    toggleDrawing(false); 
    
    enableSignatureBtn.addEventListener('click', () => {
        toggleDrawing(true);
    });
    clearSignatureBtn.addEventListener('click', clearSignature);
}

document.addEventListener('DOMContentLoaded', initSignatureCanvas);

function openModal() {
    infoModal.classList.add('visible');
    document.body.classList.add('no-scroll');
}

function closeModal() {
    infoModal.classList.remove('visible');
    document.body.classList.remove('no-scroll');
}

// 綁定事件監聽器
infoBtn.addEventListener('click', openModal);
closeButton.addEventListener('click', closeModal);
infoModal.addEventListener('click', (e) => {
    if (e.target.id === 'infoModal') {
        closeModal();
    }
});

// 每次刷新頁面時生成一個新的 document ID
let currentDocId = Date.now().toString(36) + Math.random().toString(36).substring(2, 10); // 每刷新頁面都會不同

combineBtn.addEventListener('click', async () => {
    let hasError = false;
    hideAllAlerts();
    let firstErrorBlock = null;

    document.querySelectorAll('.photo-uploader').forEach((block, i) => {
        const textInput = block.querySelector('.text-input');
        const photoAlert = block.querySelector('.photo-alert');

        if (!photoData[i] || !photoData[i].image) {
            photoAlert.textContent = '請上傳照片！';
            photoAlert.classList.remove('hidden');
            hasError = true;
            if (!firstErrorBlock) firstErrorBlock = block;
        } else {
            photoAlert.classList.add('hidden');
        }

        if (photoData[i]) photoData[i].text = textInput.value;
    });

    if (hasError) {
        if (firstErrorBlock) firstErrorBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    document.getElementById("output-section").style.display = "block";
    const selectedPhotos = photoData.filter(p => p.image);

    // 清空畫布
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;

    const padding = 20;
    const numPhotos = selectedPhotos.length;
    let rows, cols;
    if (numPhotos <= 4) {
        rows = numPhotos === 3 || numPhotos === 4 ? 2 : 1;
        cols = numPhotos === 3 ? 2 : (numPhotos === 4 ? 2 : numPhotos);
    } else {
        rows = 2;
        cols = Math.ceil(numPhotos / 2);
    }

    const drawAreaHeight = canvas.height * 0.85;
    const totalPhotoWidth = canvas.width - (cols + 1) * padding;
    const totalPhotoHeight = drawAreaHeight - (rows + 1) * padding;
    const photoCellWidth = totalPhotoWidth / cols;
    const photoCellHeight = totalPhotoHeight / rows;

    selectedPhotos.forEach((data, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = col * (photoCellWidth + padding) + padding;
        const y = row * (photoCellHeight + padding) + padding;

        const image = data.image;
        const imageRatio = image.width / image.height;
        const cellRatio = photoCellWidth / photoCellHeight;

        let drawWidth, drawHeight, drawX, drawY;
        if (imageRatio > cellRatio) {
            drawWidth = photoCellWidth;
            drawHeight = photoCellWidth / imageRatio;
            drawX = x;
            drawY = y + (photoCellHeight - drawHeight) / 2;
        } else {
            drawHeight = photoCellHeight;
            drawWidth = photoCellHeight * imageRatio;
            drawX = x + (photoCellWidth - drawWidth) / 2;
            drawY = y;
        }
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        const text = data.text || '';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.shadowBlur = 5;
        ctx.fillText(text, x + photoCellWidth / 2, y + 80);
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
    });

    const now = new Date();
    const dateTimeString = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    const className = classNameInput.value || '未輸入班別';

    /** 上傳資料 */
    const photosWithText = photoData.filter(p => p.image).map(p => ({ text: p.text || '' }));
    const userAgent = navigator.userAgent;
    const signatureBase64 = signatureDrawn ? signatureCanvas.toDataURL('image/png') : null;

    try {
        if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            const recordData = {
                userId: auth.currentUser.uid, // 標示是誰上傳
                docId: currentDocId,          // 標示這筆資料唯一 ID
                className: className,
                date: new Date(),
                photos: photosWithText,
                signatureImage: signatureBase64,
                userAgent: userAgent
            };

            // 使用 currentDocId 作為 document ID，每刷新頁面就會不同
            const docRef = doc(db, `artifacts/${__app_id}/records`, currentDocId);
            await setDoc(docRef, recordData);

            console.log("資料已成功儲存或更新，ID:", currentDocId);
        } else {
            console.error("無法儲存資料，使用者未登入或匿名登入失敗。");
        }
    } catch (e) {
        console.error("寫入資料失敗:", e);
    }

    /** 畫布加上時間、班別、簽名 */
    const textYOffset = canvas.height * 0.95;
    const mainPadding = 50;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 35px Arial';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'black';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;

    ctx.fillText(dateTimeString, canvas.width - mainPadding, textYOffset - 50);
    ctx.fillText(`${className}`, canvas.width - mainPadding, textYOffset);

    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;

    if (signatureDrawn) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = signatureCanvas.width;
        tempCanvas.height = signatureCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(signatureCanvas, 0, 0);

        tempCtx.globalCompositeOperation = 'source-atop';
        tempCtx.fillStyle = '#0000FF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.globalCompositeOperation = 'source-over';

        const signatureRatio = tempCanvas.width / tempCanvas.height;
        const targetSignatureWidth = canvas.width * 0.20;
        const targetSignatureHeight = targetSignatureWidth / signatureRatio;
        const signatureX = mainPadding;
        const signatureY = canvas.height * 0.85 + (canvas.height * 0.15 - targetSignatureHeight)/2;

        ctx.drawImage(tempCanvas, signatureX, signatureY, targetSignatureWidth, targetSignatureHeight);
    }

    const imageURL = canvas.toDataURL('image/jpeg', 0.9);
    finalImage.src = imageURL;
    finalImage.style.display = 'block';

    setTimeout(() => {
        finalImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
});
