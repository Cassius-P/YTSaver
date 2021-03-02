const {app, BrowserWindow, ipcMain, dialog } = require('electron')

//Youtube
//const youtubedl = require('youtube-dl-exec')
const ytdl = require('ytdl-core');
const youtubedl = require('@corollarium/youtubedl-wrapper')

//Utils
const slugify = require('slugify')

//File System
const fs = require('fs')
const progress = require('progress-stream');

//DB
const db = require('electron-db');
db.createTable('videos', (succ, msg) => {
    // succ - boolean, tells if the call is successful
    console.log("Success: " + succ);
    console.log("Message: " + msg);
})
const path = require('path')



// This will save the database in the same directory as the application.
const location = path.join(__dirname, '')
if (!db.valid('videos')) {
    db.createTable('videos', location, (succ, msg) => {
        // succ - boolean, tells if the call is successful
        if (succ) {
            console.log(msg)
        } else {
            console.log('An error has occured. ' + msg)
        }
    })
}

//Window
let win = null;

function createWindow () {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        resizable:false,
        maximizable:false,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadFile('pages/index.html')
    win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

ipcMain.handle('getInfosFromUrl', (event, args) => {



    let out = "La vidéo existe déjà"
    let infosAPI = undefined;
    return ytdl.getBasicInfo(args).then((videoInfo)=>{

        let infos = new Object();

        infos.title = videoInfo.videoDetails.title;
        infos.url = videoInfo.videoDetails.video_url;
        infos.owner = videoInfo.videoDetails.ownerChannelName;
        infos.publishDate = videoInfo.videoDetails.publishDate;
        infos.lenght = videoInfo.videoDetails.lengthSeconds;
        infos.video_id = videoInfo.videoDetails.videoId;
        infos.timestamp = Date.now();

        if (db.valid('videos')) {
            db.getRows('videos', {
                url: infos.url
            }, (succ, result) => {
                if(result.length == 0){
                    db.insertTableContent('videos', infos, (succ, msg) => {
                        console.log("Success: " + succ);
                    })
                }else{
                    out = "La vidéo existe déjà"
                }
            })
        }
    })
    return out




});

ipcMain.handle('getList', (event, args) => {
    let list = []

    db.getAll('videos', (succ, data) => {
        list = data;
        console.log(succ)
    })

    return list

})

ipcMain.handle('downloadVideo', (event, args) => {
    let fileName = slugify(args[1], '_')
    let infos = dialog.showSaveDialog({defaultPath: fileName+".mp4", title: fileName}).then((i)=>{
        if(!i.canceled){
            let f = fs.createWriteStream(i.filePath)
            var stat = fs.statSync(i.filePath);
            var str = progress({
                length: stat.size,
                time: 100 /* ms */
            });
            /*ytdl(args[0]).pipe(f)*/

            let dl = new youtubedl.Youtubedl()
            let doDownload = dl.download(args[0], fileName, ["-f", "best"])

            doDownload.on("download", data => {
                console.log(
                    `${data.progress}% downloaded, ETA ${data.ETA}, speed ${data.speed}${data.speedUnit}, downloaded bytes ${data.downloaded}${data.downloadedUnit}`
                );
            });
        }
    })

    return infos

})



ipcMain.handle('deleteVideo', (event, args) => {
    db.deleteRow('videos', {'url': args}, (succ, msg) => {
        return msg
    })
})


