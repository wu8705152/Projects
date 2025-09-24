// photo.js 檔案的頂部

import { setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

const open_upload = true;

const __firebase_config = {
    apiKey: "AIzaSyD5Qk5UrYr2nZHwvP5v_x_p9URBXxsEQ1w",
    authDomain: "project1-65fd2.firebaseapp.com",
    projectId: "project1-65fd2",
    storageBucket: "project1-65fd2.appspot.com",  
    messagingSenderId: "1092092998314",
    appId: "1:1092092998314:web:82615aa69da6897ccb16d3",
    measurementId: "G-2QX78R2CST"
};

const __app_id = "1:1092092998314:web:82615aa69da6897ccb16d3";

let db, auth, storage;  
let __initial_auth_token;
let userLocation = null;  

window.onload = function() {
    const firebaseConfig = __firebase_config;

    if (Object.keys(firebaseConfig).length > 0) {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);  

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

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
            };
            console.log("已取得位置:", userLocation);
        },
        (error) => {
            console.error("無法取得定位資訊:", error.message);
        }
        );
    } else {
        console.error("此瀏覽器不支援定位功能");
    }
}
window.addEventListener('beforeunload', (event) => {
    const hasUploadedPhotos = photoData.some(p => p.image);
    if (hasUploadedPhotos) {
        event.returnValue = '您的照片尚未儲存，確定要離開嗎？';
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

const cameraToggle = document.getElementById('cameraToggle');
// ✅ 新增：取得文字標籤元素
const toggleLabel = document.getElementById('toggleLabel');


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

// ✅ 新增：取得新增照片的圖示元素
const addIcon = document.getElementById('addIcon');

// ✅ 監聽開關的變動事件，並更新文字和圖示
cameraToggle.addEventListener('change', () => {
    if (cameraToggle.checked) {
        // 開啟相機模式
        toggleLabel.textContent = '用相機拍照';
        addIcon.innerHTML = '📸'; // 使用相機圖示
    } else {
        // 選擇檔案模式
        toggleLabel.textContent = '選擇檔案';
        addIcon.innerHTML = '📁'; // 使用檔案夾圖示
    }
});

// ✅ 新增函式：根據照片數量更新合併按鈕狀態
function updateCombineButtonState() {
    if (photoData.length > 0 && photoData.every(p => p.image)) {
        combineBtn.classList.remove('button-disabled');
        combineBtn.disabled = false;
    } else {
        combineBtn.classList.add('button-disabled');
        combineBtn.disabled = true;
    }
}

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
    fileInput.multiple = true;
    fileInput.id = `photo-input-${index}`;
    if (cameraToggle.checked) {
        fileInput.setAttribute('capture', 'camera');
    }
    div.appendChild(fileInput); 

    const photoAlert = document.createElement('span');
    photoAlert.className = 'photo-alert hidden';
    photoAlert.textContent = '請上傳照片！';

    const previewContainer = document.createElement('div');
    previewContainer.className = 'photo-preview-container';
    
    previewContainer.innerHTML = `
    <span class="photo-preview-content">
        <span class="camera-icon">📸</span>
        <span class="photo-preview-text">點擊選擇檔案</span>
    </span>
    <div class="photo-loader hidden"></div>
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

    return div;
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
checkAddButtonVisibility();
// ✅ 初始時禁用按鈕
updateCombineButtonState();

function hideAllAlerts() {
    document.querySelectorAll('.photo-alert').forEach(alert => {
        alert.classList.add('hidden');
    });
}

async function processFile(file, index, block) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        const loader = block.querySelector('.photo-loader');
        const previewContent = block.querySelector('.photo-preview-content');

        if (loader) loader.classList.remove('hidden');
        if (previewContent) previewContent.classList.add('hidden');

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                photoData[index].image = img;
                block.querySelector('.photo-alert').classList.add('hidden');
                
                const previewContainer = block.querySelector('.photo-preview-container');
                previewContainer.innerHTML = '';

                const previewImg = document.createElement('img');
                previewImg.className = 'photo-preview-image';
                previewImg.src = e.target.result;
                previewContainer.appendChild(previewImg);

                const retakeOverlay = document.createElement('div');
                retakeOverlay.className = 'photo-retake-overlay';
                retakeOverlay.innerHTML = '<span class="camera-icon">📸</span> RETAKE';
                previewContainer.appendChild(retakeOverlay);
                
                if (loader) loader.classList.add('hidden');
                
                setTimeout(() => {
                    block.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center', 
                        inline: 'nearest'
                    });
                }, 100);
                
                // ✅ 檔案處理完成後更新按鈕狀態
                updateCombineButtonState();
                resolve();
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}

addPhotoBlock.addEventListener('click', () => {
    hideAllAlerts();

    // 檢查總數是否已達上限
    if (photoData.length >= MAX_PHOTOS) {
        const lastBlock = document.querySelector(`.photo-uploader[data-index="${photoData.length - 1}"]`);
        if (lastBlock) {
            const alertElement = lastBlock.querySelector('.photo-alert');
            alertElement.textContent = `最多只能新增 ${MAX_PHOTOS} 張照片！`;
            alertElement.classList.remove('hidden');
            setTimeout(() => {
                lastBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        return;
    }

    const lastPhotoData = photoData[photoData.length - 1];
    if (photoData.length > 0 && !lastPhotoData.image) {
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

    // 透過隱藏的 input 觸發檔案選擇，用於新增
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.accept = 'image/*';
    tempInput.multiple = true;
    tempInput.style.display = 'none';

    if (cameraToggle.checked) {
        tempInput.setAttribute('capture', 'camera');
    }
    
    document.body.appendChild(tempInput);

    tempInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (files.length === 0) {
            document.body.removeChild(tempInput);
            return;
        }

        const newIndex = photoData.length;
        const remainingSlots = MAX_PHOTOS - newIndex;
        
        // 只在新增時檢查是否超過總數上限
        if (files.length > remainingSlots) {
            let alertElement = document.getElementById('addPhotoBlock').querySelector('.photo-alert');
            if (!alertElement) {
                alertElement = document.createElement('span');
                alertElement.className = 'photo-alert hidden';
                document.getElementById('addPhotoBlock').appendChild(alertElement);
            }
            
            alertElement.textContent = `您已上傳 ${newIndex} 張照片，一次最多只能再新增 ${remainingSlots} 張。`;
            alertElement.classList.remove('hidden');
            
            document.body.removeChild(tempInput);
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const currentNewIndex = photoData.length;
            const newBlock = createPhotoInputBlock(currentNewIndex);
            photoData.push({});
            await processFile(files[i], currentNewIndex, newBlock);
        }
        
        document.body.removeChild(tempInput);
        checkAddButtonVisibility();
        updateCombineButtonState();
    });

    tempInput.click();
});



const warningBanner = document.getElementById('warningBanner');
const closeWarningBtn = document.querySelector('.warning-banner .close-btn');

let bannerHasBeenShown = false;

closeWarningBtn.addEventListener('click', () => {
    warningBanner.style.display = 'none';
});

photoInputsContainer.addEventListener('change', async (e) => {
    if (e.target.classList.contains('photo-input')) {
        const block = e.target.closest('.photo-uploader');
        const files = e.target.files;
        const index = parseInt(block.dataset.index);

        if (files.length === 0) {
            return;
        }

        // 檢查是否為新增照片（不是替換），且上傳了多張檔案
        // 替換（RETAKE）時，files.length 一定是 1，且該區塊已有照片
        // 只有在一次上傳多張檔案時，才進行數量檢查
        if (files.length > 1) {
            const currentPhotoCount = photoData.length;
            const remainingSlots = MAX_PHOTOS - currentPhotoCount;

            if (files.length > remainingSlots) {
                const alertElement = block.querySelector('.photo-alert');
                alertElement.textContent = `您已上傳 ${currentPhotoCount} 張照片，一次最多只能再新增 ${remainingSlots} 張。`;
                alertElement.classList.remove('hidden');
                
                e.target.value = '';
                
                setTimeout(() => {
                    block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                return;
            }
        }

        // 處理當前上傳的檔案
        await processFile(files[0], index, block);

        // 如果有多張照片，新增新區塊並處理剩餘的檔案
        if (files.length > 1) {
            for (let i = 1; i < files.length; i++) {
                const currentNewIndex = photoData.length;
                const newBlock = createPhotoInputBlock(currentNewIndex);
                photoData.push({});
                await processFile(files[i], currentNewIndex, newBlock);
            }
        }
        
        checkAddButtonVisibility();
        updateCombineButtonState();

        if (!bannerHasBeenShown) {
            warningBanner.style.display = 'block';
            bannerHasBeenShown = true;
        }
    }
});


classNameInput.addEventListener('change', (e) => {
    e.target.blur();
});

photoInputsContainer.addEventListener('click', (e) => {
    // 檢查點擊的目標是否為「刪除按鈕」
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
        updateCombineButtonState();
        return; 
    }

    // 檢查點擊的目標是否為重新拍照的預覽區塊
    const retakeOverlay = e.target.closest('.photo-retake-overlay');
    if (retakeOverlay) {
        // 取得最上層的 .photo-uploader 區塊
        const block = retakeOverlay.closest('.photo-uploader');
        const fileInput = block.querySelector('.photo-input');
        if (fileInput) {
            // 直接觸發隱藏的 input 點擊事件
            fileInput.click();
        }
        return; 
    }

    // 檢查點擊的目標是否為預設的預覽區塊（即尚未上傳照片的區塊）
    const previewContainer = e.target.closest('.photo-preview-container');
    if (previewContainer) {
        // 取得最上層的 .photo-uploader 區塊
        const block = previewContainer.closest('.photo-uploader');
        if (block) {
            const fileInput = block.querySelector('.photo-input');
            if (fileInput) {
                // 直接觸發隱藏的 input 點擊事件
                fileInput.click();
            }
        }
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

function drawHintText(text) {
    signatureCtx.clearRect(0, 0, 0, 0); // 清除整個畫布
    signatureCtx.fillStyle = '#888';
    signatureCtx.font = '20px Arial';
    signatureCtx.textAlign = 'center';
    signatureCtx.textBaseline = 'middle';
    signatureCtx.fillText(text, signatureCanvas.width / 2, signatureCanvas.height / 2);
}

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
        
        enableSignatureBtn.classList.add('button-disabled');
        enableSignatureBtn.disabled = true;

        if(!signatureDrawn) {
            signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            drawHintText('開始簽名');
        }
    } else {
        for (let event in drawingEvents) {
            signatureCanvas.removeEventListener(event, drawingEvents[event]);//清除畫布並
        }
        signatureCanvas.classList.remove('active');
        signatureCanvas.classList.add('disabled');
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);//清除畫布並
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

    enableSignatureBtn.classList.remove('button-disabled');
    enableSignatureBtn.disabled = false;
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

infoBtn.addEventListener('click', openModal);
closeButton.addEventListener('click', closeModal);
infoModal.addEventListener('click', (e) => {
    if (e.target.id === 'infoModal') {
        closeModal();
    }
});

let currentDocId = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

combineBtn.addEventListener('click', async () => {
    // ✅ 關鍵修正：檢查是否有照片，沒有則直接顯示警告
    if (photoData.length === 0) {
        // 使用 addPhotoBlock 的警示區塊
        let alertElement = document.getElementById('addPhotoBlock').querySelector('.photo-alert');
        if (!alertElement) {
            alertElement = document.createElement('span');
            alertElement.className = 'photo-alert hidden';
            document.getElementById('addPhotoBlock').appendChild(alertElement);
        }
        
        alertElement.textContent = '請至少上傳一張照片才能合併！';
        alertElement.classList.remove('hidden');
        return; // 中止後續動作
    }


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
    const className = classNameInput.value || '';
    
    if (open_upload) {
        const photosWithText = photoData.filter(p => p.image).map(p => ({ text: p.text || '' }));
        const userAgent = navigator.userAgent;
        const signatureBase64 = signatureDrawn ? signatureCanvas.toDataURL('image/png') : null;

        try {
            if (auth.currentUser) {
                const userId = auth.currentUser.uid;
                const recordData = {
                    userId: userId, 
                    docId: currentDocId, 
                    className: className,
                    date: new Date(),
                    photos: photosWithText,
                    signatureImage: signatureBase64,
                    userAgent: userAgent,
                    location: userLocation 
                };

                const docRef = doc(db, `artifacts/${__app_id}/records`, currentDocId);
                await setDoc(docRef, recordData);

                console.log("資料已成功儲存或更新，ID:", currentDocId);
            } else {
                console.error("無法儲存資料，使用者未登入或匿名登入失敗。");
            }
        } catch (e) {
            console.error("寫入資料失敗:", e);
        }
    } else {
        console.log("上傳功能已關閉，未將資料傳送至 Firebase。");
    }

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

