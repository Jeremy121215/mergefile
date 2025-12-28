// PDF-ZIP合并工具
document.addEventListener('DOMContentLoaded', function() {
    // 状态管理
    const state = {
        pdfFile: null,
        zipFile: null,
        mergedBlob: null,
        mergedFileName: '',
        selectedExt: 'pdf'
    };

    // DOM元素引用
    const elements = {
        // PDF文件相关
        pdfInput: document.getElementById('pdfInput'),
        pdfDropZone: document.getElementById('pdfDropZone'),
        browsePdfBtn: document.getElementById('browsePdfBtn'),
        clearPdfBtn: document.getElementById('clearPdfBtn'),
        pdfFileName: document.getElementById('pdfFileName'),
        pdfFileSize: document.getElementById('pdfFileSize'),
        pdfSizeValue: document.getElementById('pdfSizeValue'),
        
        // ZIP文件相关
        zipInput: document.getElementById('zipInput'),
        zipDropZone: document.getElementById('zipDropZone'),
        browseZipBtn: document.getElementById('browseZipBtn'),
        clearZipBtn: document.getElementById('clearZipBtn'),
        zipFileName: document.getElementById('zipFileName'),
        zipFileSize: document.getElementById('zipFileSize'),
        zipSizeValue: document.getElementById('zipSizeValue'),
        
        // 输出设置
        outputName: document.getElementById('outputName'),
        extButtons: document.querySelectorAll('.ext-btn'),
        
        // 内存信息
        totalSizeValue: document.getElementById('totalSizeValue'),
        
        // 合并按钮
        mergeBtn: document.getElementById('mergeBtn'),
        
        // 结果区域
        resultSection: document.getElementById('resultSection'),
        resultFileName: document.getElementById('resultFileName'),
        resultFileSize: document.getElementById('resultFileSize'),
        downloadBtn: document.getElementById('downloadBtn'),
        newMergeBtn: document.getElementById('newMergeBtn')
    };

    // 初始化
    function init() {
        setupEventListeners();
        updateMergeButton();
        updateMemoryInfo();
    }

    // 设置事件监听器
    function setupEventListeners() {
        // PDF文件事件
        elements.browsePdfBtn.addEventListener('click', () => elements.pdfInput.click());
        elements.pdfInput.addEventListener('change', (e) => handleFileSelect(e, 'pdf'));
        elements.clearPdfBtn.addEventListener('click', () => clearFile('pdf'));
        
        // ZIP文件事件
        elements.browseZipBtn.addEventListener('click', () => elements.zipInput.click());
        elements.zipInput.addEventListener('change', (e) => handleFileSelect(e, 'zip'));
        elements.clearZipBtn.addEventListener('click', () => clearFile('zip'));
        
        // 拖放事件
        setupDragDrop('pdf');
        setupDragDrop('zip');
        
        // 后缀选择事件
        elements.extButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                elements.extButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                state.selectedExt = e.target.dataset.ext;
            });
        });
        
        // 合并事件
        elements.mergeBtn.addEventListener('click', mergeFiles);
        
        // 结果事件
        elements.downloadBtn.addEventListener('click', downloadMergedFile);
        elements.newMergeBtn.addEventListener('click', startNewMerge);
    }

    // 设置拖放功能
    function setupDragDrop(type) {
        const dropZone = type === 'pdf' ? elements.pdfDropZone : elements.zipDropZone;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect({ target: { files } }, type);
            }
        });
    }

    // 处理文件选择
    function handleFileSelect(e, type) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (type === 'pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('请选择PDF文件');
            return;
        }
        
        if (type === 'zip') {
            const validExts = ['.zip', '.rar', '.7z', '.tar', '.gz'];
            const fileExt = '.' + file.name.toLowerCase().split('.').pop();
            if (!validExts.includes(fileExt)) {
                alert('请选择压缩文件（ZIP、RAR、7Z、TAR、GZ）');
                return;
            }
        }
        
        // 更新状态
        state[type + 'File'] = file;
        
        // 更新UI
        updateFileInfo(type, file);
        updateClearButton(type);
        updateMergeButton();
        updateMemoryInfo();
        
        // 显示通知
        showNotification(`已选择${type.toUpperCase()}文件: ${file.name}`);
    }

    // 更新文件信息
    function updateFileInfo(type, file) {
        const fileName = type === 'pdf' ? elements.pdfFileName : elements.zipFileName;
        const fileSize = type === 'pdf' ? elements.pdfFileSize : elements.zipFileSize;
        
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
    }

    // 更新清除按钮
    function updateClearButton(type) {
        const clearBtn = type === 'pdf' ? elements.clearPdfBtn : elements.clearZipBtn;
        clearBtn.style.display = 'block';
    }

    // 清除文件
    function clearFile(type) {
        state[type + 'File'] = null;
        
        // 重置输入
        if (type === 'pdf') {
            elements.pdfInput.value = '';
            elements.pdfFileName.textContent = '未选择文件';
            elements.pdfFileSize.textContent = '0 MB';
            elements.clearPdfBtn.style.display = 'none';
        } else {
            elements.zipInput.value = '';
            elements.zipFileName.textContent = '未选择文件';
            elements.zipFileSize.textContent = '0 MB';
            elements.clearZipBtn.style.display = 'none';
        }
        
        updateMergeButton();
        updateMemoryInfo();
    }

    // 更新合并按钮状态
    function updateMergeButton() {
        elements.mergeBtn.disabled = !(state.pdfFile && state.zipFile);
        
        if (state.pdfFile && state.zipFile) {
            elements.mergeBtn.innerHTML = `<i class="fas fa-compress-arrows-alt"></i> 合并文件`;
        }
    }

    // 更新内存信息
    function updateMemoryInfo() {
        const pdfSize = state.pdfFile ? state.pdfFile.size : 0;
        const zipSize = state.zipFile ? state.zipFile.size : 0;
        const totalSize = pdfSize + zipSize;
        
        elements.pdfSizeValue.textContent = formatFileSize(pdfSize);
        elements.zipSizeValue.textContent = formatFileSize(zipSize);
        elements.totalSizeValue.textContent = formatFileSize(totalSize);
    }

    // 合并文件
    async function mergeFiles() {
        if (!state.pdfFile || !state.zipFile) {
            alert('请选择PDF和ZIP文件');
            return;
        }
        
        try {
            // 显示加载状态
            elements.mergeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合并中...';
            elements.mergeBtn.disabled = true;
            
            // 获取输出文件名
            const outputName = elements.outputName.value.trim() || 'combined_file';
            const outputExt = state.selectedExt;
            
            // 创建合并后的Blob
            const mergedBlob = await createMergedBlob();
            
            // 保存状态
            state.mergedBlob = mergedBlob;
            state.mergedFileName = `${outputName}.${outputExt}`;
            
            // 显示结果
            elements.resultFileName.textContent = state.mergedFileName;
            elements.resultFileSize.textContent = formatFileSize(mergedBlob.size);
            elements.resultSection.style.display = 'block';
            
            // 滚动到结果区域
            elements.resultSection.scrollIntoView({ behavior: 'smooth' });
            
            // 重置合并按钮
            elements.mergeBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> 合并文件';
            elements.mergeBtn.disabled = false;
            
            showNotification('文件合并成功！');
            
        } catch (error) {
            console.error('合并文件时出错:', error);
            alert('合并文件时出错: ' + error.message);
            
            // 重置合并按钮
            elements.mergeBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> 合并文件';
            elements.mergeBtn.disabled = false;
        }
    }

    // 创建合并后的Blob
    async function createMergedBlob() {
        // 读取PDF文件
        const pdfArrayBuffer = await readFileAsArrayBuffer(state.pdfFile);
        
        // 读取ZIP文件
        const zipArrayBuffer = await readFileAsArrayBuffer(state.zipFile);
        
        // 验证PDF文件头
        const pdfHeader = new Uint8Array(pdfArrayBuffer, 0, 5);
        const pdfHeaderStr = String.fromCharCode(...pdfHeader);
        if (pdfHeaderStr !== '%PDF-') {
            alert('PDF文件格式不正确，应以 %PDF- 开头');
            throw new Error('Invalid PDF file');
        }
        
        // 验证ZIP文件头（检查PK头）
        const zipHeader = new Uint8Array(zipArrayBuffer, 0, 4);
        if (zipHeader[0] !== 0x50 || zipHeader[1] !== 0x4B || zipHeader[2] !== 0x03 || zipHeader[3] !== 0x04) {
            alert('ZIP文件格式不正确，应以PK头开头');
            throw new Error('Invalid ZIP file');
        }
        
        // 合并两个文件：PDF在前，ZIP在后
        const totalLength = pdfArrayBuffer.byteLength + zipArrayBuffer.byteLength;
        const result = new Uint8Array(totalLength);
        
        // 添加PDF数据
        result.set(new Uint8Array(pdfArrayBuffer), 0);
        
        // 添加ZIP数据
        result.set(new Uint8Array(zipArrayBuffer), pdfArrayBuffer.byteLength);
        
        return new Blob([result]);
    }

    // 读取文件为ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // 下载合并后的文件
    function downloadMergedFile() {
        if (!state.mergedBlob) return;
        
        const url = URL.createObjectURL(state.mergedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.mergedFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('文件下载开始');
    }

    // 开始新的合并
    function startNewMerge() {
        // 隐藏结果区域
        elements.resultSection.style.display = 'none';
        
        // 清除所有文件
        clearFile('pdf');
        clearFile('zip');
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 辅助函数
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // 样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        // 添加CSS动画
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 初始化应用
    init();
});
