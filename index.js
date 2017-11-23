let gUtil = require('gulp-util');
let through = require('through2');
let path = require('path');
let fs = require('fs');
const PLUGIN_NAME = "gulp-find-unused";
let debug;
let ignoreList = [],
    fileList = [];
let fileLeftDir;

function getFile(fullPath) {
    let data = fs.readFileSync(fullPath, 'utf-8')
    return data;
}

//检测文件或者文件夹存在 nodeJS
function fsExistsSync(path) {
    try {
        fs.accessSync(path, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

function readFileList(filePath, fileList) {
    let files = fs.readdirSync(filePath);
    files.forEach((item) => {
        let stat = fs.statSync(path.resolve(filePath, item));
        if (stat.isDirectory()) {
            readFileList(path.resolve(filePath, item), fileList)
        } else {
            let obj = {};
            let fileAbs = path.resolve(filePath, item);
            fileAbs = fileAbs.split(path.sep).join("/");
            filePath = filePath.split(path.sep).join("/");
            obj.path = filePath;
            obj.fileName = item;
            obj.fileAbs = fileAbs;
            obj.size = stat.size;
            obj.useList = [];
            obj.matchedPath = "";
            obj.pathGroup = [] || obj.pathGroup;
            let fileAbsGroup = fileAbs.split("/");
            while (fileAbsGroup.length) {
                fileAbsGroup.shift();
                let newStr = fileAbsGroup.join("/");
                if (!!~ignoreList.indexOf(newStr)) {
                    obj.ignore = true;
                }
                newStr && obj.pathGroup.push(newStr)
            }
            fileList.push(obj);
        }
    })
    return fileList;
}

function searchFileNotUse() {
    if (debug) {
        gUtil.log(gUtil.colors.green.bold(`开始处理：`));
    }

    for (let file of fileList) {
        if (file.ignore) continue;
        let pathGroup = file.pathGroup;
        if (debug) {
            gUtil.log(gUtil.colors.green.bold("处理" + file.fileAbs));
        }
        for (let d of fileList) {
            let tmpPath = path.resolve(d.path, d.fileName);
            let fileContent = getFile(tmpPath)
            for (let dd of pathGroup) {
                if (!!~fileContent.indexOf(dd)) {
                    if (!~file.useList.indexOf(d.fileAbs)) {
                        file.useList.push(d.fileAbs);
                        file.matchedPath = dd;
                    }
                }
            }
        }
    }

    return fileList
}

function writeRes(dir, data) {
    if (path.isAbsolute(dir)) {
        fs.writeFileSync(path.join(dir, 'ry.json'), new Buffer(JSON.stringify(data), 'utf-8'))
    }
    else {
        let tmp = path.join(__dirname, dir);
        let isExistDir = fsExistsSync(tmp);
        if (!isExistDir) {
            fs.mkdirSync(tmp);
        }
        fileLeftDir = path.resolve(tmp, 'ry.json').split(path.sep).join("/");
        fs.writeFileSync(path.join(tmp, 'ry.json'), new Buffer(JSON.stringify(data), 'utf-8'))
    }
}

/*
 * options:Object
 * ignoreList:Array 忽略列表
 *
 * */
module.exports = function (options) {
    options = options || {
            ignoreList: [],
            createFile: false,
            debug: false
        };
    ignoreList = options.ignoreList || [];
    let createFile = options.createFile || false;
    debug = options.debug || false
    let fileDir;
    return through.obj(function (file, enc, cb) {
        let filePath = path.normalize(file.path);
        if (createFile) {
            fileDir = options.fileDir || filePath;
        }

        let stat = fs.statSync(filePath);
        if (!stat.isDirectory()) {
            return cb(new gUtil.PluginError(PLUGIN_NAME, 'please only send the directory name parameter to gulp.src,no wildcards etc permitted！'));
        }

        fileList = readFileList(filePath, []);
        let res = searchFileNotUse();
        let count = 0;
        let totalSize = 0;
        let rongyu = [];
        res.forEach((file) => {
            if (!file.useList.length && !file.ignore) {
                count++;
                rongyu.push(file.fileName);
                totalSize += file.size;
                if (debug) {
                    gUtil.log(gUtil.colors.red.bold(`发现可疑冗余文件：${file.fileName}，路径：${file.fileAbs},文件大小:：${file.size}`));
                }
            }
        })

        if (createFile) {
            writeRes(fileDir || filePath, rongyu)
        }

        if (debug) {
            gUtil.log(gUtil.colors.green.bold(`扫描文件个数：${fileList.length}`));
            if (count > 0) {
                gUtil.log(gUtil.colors.red.bold(`可疑冗余文件个数：${count}，请确认`));
                gUtil.log(gUtil.colors.red.bold(`冗余率：` + ((count / fileList.length).toFixed(6) * 100) + "%"));
                gUtil.log(gUtil.colors.red.bold("冗余文件总大小【" + totalSize + '】B'));
            }
            else {
                gUtil.log(gUtil.colors.red.bold(`暂未发现冗余文件`));
            }

            if (createFile) {
                gUtil.log(gUtil.colors.green.bold('冗余文件结果在:' + fileLeftDir));
            }
            gUtil.log(gUtil.colors.green.bold('处理完毕'));
        }

        this.push(file);
        cb();
    });
};
