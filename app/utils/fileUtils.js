import Vue from 'vue';
const path = require("path");
const fs = require('fs');
const fse = require('fs-extra');

export const getTreeByFilePath = ({strategy, fileTree}) => {
    let strategyPath = strategy.filePath;
    strategyPath = path.normalize(strategyPath)
    const filePath = path.resolve(strategyPath);
    let dirList = [];
    let fileList = [];
    let ids = {
        file: [],
        folder: []
    };

    const ignoreList = ['.git', '.DS_Store']
    return new Promise((resolve, reject) => {
        fs.readdir(filePath, (err, files) => {
            if(err) {
                console.error(err)
                reject(err)
            }else {
                files.forEach(file => {
                    if(ignoreList.indexOf(file) !== -1) return;
                    const fileDir = path.join(filePath, file);
                    const stats = fs.statSync(fileDir)
                    if(stats){
                        const isDir = stats.isDirectory();
                        const fileInfo = buildFileObj({
                                isDir,
                                name: file,
                                ext: path.extname(fileDir).slice(path.extname(fileDir).indexOf('.') + 1),
                                filePath: fileDir,
                                parentId: strategy.id,
                                children: {
                                    folder: [],
                                    file: []
                                },
                                stats
                        })
                        //保证顺序
                        if(isDir){
                            dirList.push(fileInfo)
                        }else{
                            fileList.push(fileInfo)
                        }
                    }
                })
                dirList.forEach(dir => {
                    const id = window.fileId++
                    ids.folder.push(id);
                    fileTree[id] = {
                        ...dir,
                        id
                    }
                })
                fileList.forEach(async file => {
                    const id = window.fileId++
                    ids.file.push(id);
                    fileTree[id] = {
                        ...file,
                        id
                    }
                })
                resolve({ids, fileTree})
            }
        })
    })    
}

//清空children
export const clearChildrenByFileId = (fileTree, fileId) => {
    const target = fileTree[fileId]
    const children = target.children;
    const files = children['file'] || [];
    const folders = children['folders'] || [];

    [...files, ...folders].forEach(id => {
        fileTree[id] = null
        delete fileTree[id]
    }) 

    target.children = {
        file: [],
        folder: []
    }
    return fileTree
}


//建立fileObj
export const buildFileObj = ({
    id,
    isDir,
    name,
    ext,
    filePath,
    children,
    stats,
    root,
    open,
    parentId,
}) => {
    return {
        id,
        isDir,
        name,
        ext,
        filePath,
        children,
        stats,
        root,
        open,
        parentId
    }
}

//打开文件树
/**
 * @param  {object} folder
 * @param  {object} oldFileTree
 * @param  {boolean} openStatus
 * @param  {boolean} force 强制清空
 */
export const openFolder = (folder, oldFileTree, openStatus, force) => {
    oldFileTree = Vue.utils.deepClone(oldFileTree);
    //清空
    if(force) oldFileTree = clearChildrenByFileId(oldFileTree, folder.id);
    return new Promise(async (resolve) => {
        if(openStatus === undefined){
            openStatus = !folder.open
        }
        if(openStatus){
            const {ids, fileTree} = await getTreeByFilePath({
                strategy: folder,
                fileTree: oldFileTree
            })    
            Vue.store.dispatch('setFileTree', fileTree)
            Vue.store.dispatch('setFileNode', {id: folder.id, attr: 'children', val: ids})
            resolve(fileTree)
        }else{
            resolve({})
        }

        //打开
        Vue.store.dispatch('setFileNode', {id: folder.id, attr: 'open', val: openStatus})

    })
    
}

//添加文件
export const addFile = (parentDir, filename, type) => {
    let targetPath;
    if(!parentDir) targetPath = filename;
    else targetPath = path.join(parentDir, filename)
    targetPath = path.normalize(targetPath)
    if(type === 'folder'){
        fse.ensureDirSync(targetPath)
    }else{
        fse.ensureFileSync(targetPath)
    }
}

//更改文件名
export const editFileFolderName = (oldPath, newPath) => {
    oldPath = path.normalize(oldPath)
    newPath = path.normalize(newPath)
    return new Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, err => {
            if(err){
                console.error(err)
                reject(err)
                return
            }
            resolve({})
        })
    })
}


// function deleteall(targetPath) {
//     targetPath = path.normalize(targetPath)
// 	var files = [];
// 	if(fs.existsSync(targetPath)) {
//         if(fs.statSync(targetPath).isDirectory()){
//             files = fs.readdirSync(targetPath);
//             files.forEach(function(file) {
//                 var curPath = targetPath + "/" + file;
//                 deleteall(curPath);
//             });
//             fs.rmdirSync(targetPath);
//         }else{
//             fs.unlinkSync(targetPath);            
//         }
// 	}
// }

//删除文件或
export const removeFileFolder = (targetPath) => {
    targetPath = path.normalize(targetPath)
    return new Promise(resolve => {
        if(!fs.existsSync(targetPath)) {
            resolve()
            return
        } 
        fse.removeSync(targetPath)
        resolve()
    }) 
}

//获取文件内容
export const getCodeText = (targetPath) => {
    if(!targetPath) return new Promise((resolve, reject) => reject(new Error('文件路径不存在！')))
    targetPath = path.normalize(targetPath)
    return new Promise((resolve, reject) => {
        fs.readFile(targetPath, (err, data) => {
            if(err){
                console.error(err)
                reject(err)
                return;
            }
            resolve(data.toString())
        })
    })
}

//写入文件
export const writeFile = (filePath, data) => {
    filePath = path.normalize(filePath)
    return new Promise((resolve, reject) => {
        if(data === undefined) reject(new Error('input data is undefined!'))
        fse.outputFile(filePath, data, err => {
            if(err){
                console.error(err)
                reject(err)
                return;
            }
            resolve({})
        })
    })
}

//清空文件内容
export const clearFileContent = (filePath) => {
    filePath = path.normalize(filePath)
    new Promise((resolve, reject) => {
        fse.outputFile(filePath, '', (err, data) => {
            if(err){
                reject(err);
                return;
            }
            resolve(data)
        })
    })
}

//打开查看文件
export const openReadFile = (logPath) => {
    if(!fs.existsSync(logPath)) return new Error(logPath, 'is not exist！');
    const shell = require('electron').shell;
    shell.openItem(logPath)
};