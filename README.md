> 这个插件主要用来检测文件夹中的资源有没有被项目使用到，也就是冗余文件检测，基于文件名称而不是AST做的检测

# Getting Started

```
npm install gulp-find-unused --save-dev
```

# Usage

```
let fu = require('gulp-find-unused');
gulp.task("fu", () => {
    return gulp.src("build_artifacts")
        .pipe(fu({
            ignoreList: ['ry.json', 'main.html'],
            createFile: true,
            debug: true,
            fileDir: "build"
        }))
        .pipe(gulp.dest("find-unused"))
})

```

# Options

## ignoreList

Type:Array Default value:[]

一个忽略检测的文件的列表

## createFile

Type:Boolean Default value:false

是否把检测结果输出到一个独立的文件中


## fileDir

`createFile`为`true`的情况下，这个值才有用

Type:String Default value:跟gulp.src的参数保持一致。

要输出的文件的路径


## debug

Type:Boolean Default value:false

是否打印日志信息

# Release History

|日期|版本|说明|
|---|---|---|
|2017-11-22|v0.1.0|First commit of gulp-find-unused.|

		 
