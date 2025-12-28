// 文件合并工具 - 主脚本
document.addEventListener('DOMContentLoaded', function() {
    // 状态管理
    const state = {
        files: [], // 存储文件对象 {file, name, size, type, id}
        totalSize: 0,
        maxSize: 100 * 1024 * 1024, // 100MB
        nextFileId: 1,
        mergedBlob: null,
        mergedFileName: ''
    };

    // DOM元素引用
    const elements = {
        fileInput: document.getElementById('fileInput'),
        browseBtn: document.getElementById('browseBtn'),
        dropZone: document.getElementById('dropZone'),
        fileList: document.getElementById('sortableList'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        addMoreBtn: document.getElementById('addMoreBtn'),
        outputName: document.getElementById('outputName'),
        outputExt: document.getElementById('outputExt'),
        customExtContainer: document.getElementById('customExtContainer'),
        customExt: document.getElementById('customExt'),
        extPreview: document.getElementById('extPreview'),
        mergeBtn: document.getElementById('mergeBtn'),
        resultSection: document.getElementById('resultSection'),
        downloadBtn: document.getElementById('downloadBtn'),
        newMergeBtn: document.getElementById('newMergeBtn'),
        addSeparator: document.getElementById('addSeparator'),
        addMetadata: document.getElementById('addMetadata'),
        
        // 统计信息元素
        fileCount: document.getElementById('fileCount'),
        totalSize: document.getElementById('totalSize'),
        filesCount: document.getElementById('filesCount'),
        combinedSize: document.getElementById('combinedSize'),
        recommendedExt: document.getElementById('recommendedExt'),
        
        // 结果元素
        resultFileName: document.getElementById('resultFileName'),
        resultFileSize: document.getElementById('resultFileSize'),
        resultFileCount: document.getElementById('resultFileCount'),
        resultExt1: document.getElementById('resultExt1'),
        resultExt2: document.getElementById('resultExt2')
    };

    // 初始化
    function init() {
        setupEventListeners();
        updateUI();
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 文件选择
        elements.browseBtn.addEventListener('click', () => elements.fileInput.click());
        elements.fileInput.addEventListener('change', handleFileSelect);
        elements.addMoreBtn.addEventListener('click', () => elements.fileInput.click());
        
        // 拖放功能
        elements.dropZone.addEventListener('dragover', handleDragOver);
        elements.dropZone.addEventListener('dragleave', handleDragLeave);
        elements.dropZone.addEventListener('drop', handleDrop);
        
        // 清除所有文件
        elements.clearAllBtn.addEventListener('click', clearAllFiles);
        
        // 输出设置
        elements.outputExt.addEventListener('change', handleExtensionChange);
        elements.customExt.addEventListener('input', handleCustomExtensionInput);
        
        // 合并功能
        elements.mergeBtn.addEventListener('click', mergeFiles);
        
        // 结果操作
        elements.downloadBtn.addEventListener('click', downloadMergedFile);
        elements.newMergeBtn.addEventListener('click', startNewMerge);
        
        // 初始化Sortable拖拽
        initSortable();
    }

    // 处理文件选择
    function handleFileSelect(e) {
        const files = Array.from(e.target.files);
        addFiles(files);
        elements.fileInput.value = ''; // 重置input
    }

    // 添加文件到列表
    function addFiles(files) {
        let addedCount = 0;
        
        files.forEach(file => {
            // 检查文件大小限制
            if (state.totalSize + file.size > state.maxSize) {
                alert(`无法添加 ${file.name}：超过100MB总大小限制`);
                return;
            }
            
            // 检查是否已存在同名文件
            const existingFile = state.files.find(f => f.name === file.name && f.size === file.size);
            if (existingFile) {
                alert(`文件 ${file.name} 已存在`);
                return;
            }
            
            // 创建文件对象
            const fileObj = {
                id: state.nextFileId++,
                file: file,
                name: file.name,
                size: file.size,
                type: getFileType(file.name),
                ext: getFileExtension(file.name)
            };
            
            state.files.push(fileObj);
            state.totalSize += file.size;
            addedCount++;
        });
        
        if (addedCount > 0) {
            updateUI();
            updateFileList();
            showNotification(`成功添加 ${addedCount} 个文件`);
        }
    }

    // 处理拖放
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.dropZone.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.dropZone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    }

    // 清除所有文件
    function clearAllFiles() {
        if (state.files.length === 0) return;
        
        if (confirm('确定要清除所有文件吗？')) {
            state.files = [];
            state.totalSize = 0;
            updateUI();
            updateFileList();
            showNotification('已清除所有文件');
        }
    }

    // 删除单个文件
    function removeFile(id) {
        const fileIndex = state.files.findIndex(f => f.id === id);
        if (fileIndex === -1) return;
        
        const removedFile = state.files[fileIndex];
        state.files.splice(fileIndex, 1);
        state.totalSize -= removedFile.size;
        
        updateUI();
        updateFileList();
        showNotification(`已移除文件: ${removedFile.name}`);
    }

    // 初始化拖拽排序
    function initSortable() {
        new Sortable(elements.fileList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            onEnd: function(evt) {
                // 更新文件顺序
                const itemId = parseInt(evt.item.dataset.id);
                const fromIndex = evt.oldIndex;
                const toIndex = evt.newIndex;
                
                // 重新排序文件数组
                const [movedFile] = state.files.splice(fromIndex, 1);
                state.files.splice(toIndex, 0, movedFile);
                
                updateUI();
                showNotification('已更新文件顺序');
            }
        });
    }

    // 更新文件列表UI
    function updateFileList() {
        elements.fileList.innerHTML = '';
        
        if (state.files.length === 0) {
            elements.fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>还没有选择任何文件。请添加至少2个文件进行合并。</p>
                </div>
            `;
            return;
        }
        
        state.files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.id = file.id;
            
            const sizeFormatted = formatFileSize(file.size);
            const icon = getFileIcon(file.type);
            
            fileItem.innerHTML = `
                <div class="file-name">
                    <i class="fas ${icon} file-icon"></i>
                    <span>${file.name}</span>
                </div>
                <div class="file-size">${sizeFormatted}</div>
                <div class="file-type">${file.type.toUpperCase()}</div>
                <div class="file-actions">
                    <button class="remove-btn" data-id="${file.id}" title="删除文件">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            elements.fileList.appendChild(fileItem);
        });
        
        // 为删除按钮添加事件监听器
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = parseInt(e.target.closest('.remove-btn').dataset.id);
                removeFile(fileId);
            });
        });
    }

    // 更新UI状态
    function updateUI() {
        // 更新统计信息
        elements.fileCount.textContent = state.files.length;
        elements.totalSize.textContent = formatFileSize(state.totalSize);
        elements.filesCount.textContent = state.files.length;
        elements.combinedSize.textContent = formatFileSize(state.totalSize);
        
        // 更新推荐后缀
        if (state.files.length > 0) {
            const firstFileExt = state.files[0].ext || 'png';
            elements.recommendedExt.textContent = `.${firstFileExt}`;
        } else {
            elements.recommendedExt.textContent = '.png';
        }
        
        // 启用/禁用合并按钮
        elements.mergeBtn.disabled = state.files.length < 2;
        
        // 更新合并按钮文本
        if (state.files.length >= 2) {
            elements.mergeBtn.innerHTML = `<i class="fas fa-compress-arrows-alt"></i> 合并 ${state.files.length} 个文件`;
        } else {
            elements.mergeBtn.innerHTML = `<i class="fas fa-compress-arrows-alt"></i> 合并文件`;
        }
    }

    // 处理扩展名变更
    function handleExtensionChange() {
        const selectedValue = elements.outputExt.value;
        
        if (selectedValue === 'custom') {
            elements.customExtContainer.style.display = 'flex';
            updateExtensionPreview();
        } else {
            elements.customExtContainer.style.display = 'none';
            updateExtensionPreview(selectedValue);
        }
    }

    // 处理自定义扩展名输入
    function handleCustomExtensionInput() {
        updateExtensionPreview();
    }

    // 更新扩展名预览
    function updateExtensionPreview(ext = null) {
        if (ext) {
            elements.extPreview.textContent = ext;
        } else {
            const customExt = elements.customExt.value.trim().toLowerCase();
            elements.extPreview.textContent = customExt || 'ext';
        }
    }

    // 合并文件
    async function mergeFiles() {
        if (state.files.length < 2) {
            alert('请至少选择2个文件进行合并');
            return;
        }
        
        try {
            // 显示加载状态
            elements.mergeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合并中...';
            elements.mergeBtn.disabled = true;
            
            // 获取输出设置
            const outputName = elements.outputName.value.trim() || 'combined_file';
            let outputExt = elements.outputExt.value;
            
            if (outputExt === 'custom') {
                outputExt = elements.customExt.value.trim().toLowerCase() || 'bin';
            }
            
            // 添加扩展名（如果没有点号）
            if (!outputExt.startsWith('.')) {
                outputExt = '.' + outputExt;
            }
            
            // 创建合并后的Blob
            const mergedBlob = await createMergedBlob();
            
            // 保存状态
            state.mergedBlob = mergedBlob;
            state.mergedFileName = `${outputName}${outputExt}`;
            
            // 显示结果
            showResult(outputName, outputExt, mergedBlob.size);
            
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
        const chunks = [];
        
        // 添加元数据（如果启用）
        if (elements.addMetadata.checked) {
            const metadata = createMetadata();
            chunks.push(metadata);
        }
        
        // 添加文件内容
        for (let i = 0; i < state.files.length; i++) {
            const file = state.files[i].file;
            
            // 读取文件内容
            const arrayBuffer = await readFileAsArrayBuffer(file);
            
            // 添加分隔符（如果启用且不是第一个文件）
            if (elements.addSeparator.checked && i > 0) {
                const separator = createSeparator(i);
                chunks.push(separator);
            }
            
            chunks.push(arrayBuffer);
        }
        
        // 合并所有ArrayBuffer
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const result = new Uint8Array(totalLength);
        
        let offset = 0;
        chunks.forEach(chunk => {
            result.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        });
        
        return new Blob([result]);
    }

    // 创建元数据
    function createMetadata() {
        const metadata = {
            tool: 'File Combiner',
            version: '1.0',
            fileCount: state.files.length,
            totalSize: state.totalSize,
            timestamp: Date.now(),
            files: state.files.map(f => ({
                name: f.name,
                size: f.size,
                type: f.type
            }))
        };
        
        const metadataStr = JSON.stringify(metadata);
        const encoder = new TextEncoder();
        const metadataBinary = encoder.encode(`FMETA${metadataStr}ENDMETA`);
        
        return metadataBinary;
    }

    // 创建分隔符
    function createSeparator(fileIndex) {
        const separatorStr = `--- FILE ${fileIndex + 1} SEPARATOR ---`;
        const encoder = new TextEncoder();
        return encoder.encode(separatorStr);
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

    // 显示合并结果
    function showResult(fileName, fileExt, fileSize) {
        // 更新结果信息
        elements.resultFileName.textContent = `${fileName}${fileExt}`;
        elements.resultFileSize.textContent = formatFileSize(fileSize);
        elements.resultFileCount.textContent = state.files.length;
        
        // 更新使用提示
        if (state.files.length >= 1) {
            elements.resultExt1.textContent = fileExt;
        }
        
        if (state.files.length >= 2) {
            const secondFileExt = state.files[1].ext || 'zip';
            elements.resultExt2.textContent = `.${secondFileExt}`;
        }
        
        // 显示结果区域
        elements.resultSection.style.display = 'block';
        
        // 滚动到结果区域
        elements.resultSection.scrollIntoView({ behavior: 'smooth' });
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
        
        // 重置状态（可选，保留文件列表）
        // state.mergedBlob = null;
        // state.mergedFileName = '';
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 辅助函数
    function getFileType(filename) {
        const ext = getFileExtension(filename).toLowerCase();
        
        const types = {
            // 文档
            'doc': 'document', 'docx': 'document', 'pdf': 'document', 'txt': 'document',
            'rtf': 'document', 'md': 'document', 'csv': 'document', 'odt': 'document',
            'ods': 'document', 'odp': 'document',
            
            // 图片
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
            'bmp': 'image', 'tiff': 'image', 'webp': 'image', 'svg': 'image',
            'ico': 'image',
            
            // 音频
            'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'ogg': 'audio',
            'aac': 'audio', 'm4a': 'audio',
            
            // 视频
            'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video',
            'webm': 'video',
            
            // 压缩文件
            'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive',
            'gz': 'archive',
            
            // 代码
            'js': 'code', 'html': 'code', 'css': 'code', 'py': 'code',
            'java': 'code', 'cpp': 'code', 'json': 'code', 'xml': 'code',
            
            // 可执行文件
            'exe': 'executable', 'msi': 'executable', 'dll': 'executable'
        };
        
        return types[ext] || 'file';
    }

    function getFileIcon(type) {
        const icons = {
            'document': 'fa-file-word',
            'image': 'fa-file-image',
            'audio': 'fa-file-audio',
            'video': 'fa-file-video',
            'archive': 'fa-file-archive',
            'code': 'fa-file-code',
            'executable': 'fa-cogs',
            'file': 'fa-file'
        };
        
        return icons[type] || 'fa-file';
    }

    function getFileExtension(filename) {
        const match = filename.match(/\.([a-zA-Z0-9]+)$/);
        return match ? match[1].toLowerCase() : '';
    }

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
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
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
