const {app, BrowserWindow, ipcMain, dialog } = require('electron')

//Youtube
const youtubedl = require('youtube-dl')
const ytdl = require('ytdl-core');
//const youtubedl = require('youtube-dl')

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
db.createTable('listdl', (succ, msg) => {
    // succ - boolean, tells if the call is successful
    console.log("Success: " + succ);
    console.log("Message: " + msg);
})
const path = require('path')



// This will save the database in the same directory as the application.

if (!db.valid('videos')) {
    db.createTable('videos', path.join(__dirname, ''), (succ, msg) => {
        // succ - boolean, tells if the call is successful
        if (succ) {
            console.log(msg)
        } else {
            console.log('An error has occured. ' + msg)
        }
    })
}

if (!db.valid('listdl')) {
    db.createTable('listdl', path.join(__dirname, ''), (succ, msg) => {
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

//Download env
let downloading = false;

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
            addToList(args[0], i.filePath, args[1])
            if(!downloading){
                downloadFromList()

                let listAfterTreatment = getDlList();
                console.log(listAfterTreatment)
                if(listAfterTreatment.length == 0){
                    downloading = false
                }else{
                    console.log("not empty list")
                    setTimeout(async ()=>{
                        await downloadFromList()
                    }, 2000)

                }
            }
        }
    })

    return infos

})

function addToList(url, path, videoName){
    let infos = new Object()
    infos.url = url;
    infos.path = path;
    infos.name = videoName
    if (db.valid('listdl')) {
        db.insertTableContent('listdl', infos, (succ, msg) => {
            // succ - boolean, tells if the call is successful
            console.log("Success: " + succ);
            console.log("Message: " + msg);
        })
    }
}


function getDlList(){
    let list = null
    db.getAll('listdl', (succ, data) => {
        if(succ){
            //console.log(data)
            list = data
        }
    })
    return list
}


function downloadItems(items){

    return new Promise(() => {

        setTimeout(() => {

            let item = items[0];

            let str = progress({
                time: 100
            });
            const video = youtubedl(item.url)

            let write = fs.createWriteStream(item.path);

            let dl = video.pipe(str).pipe(write)

            video.on('info', (info) => {
                win.webContents.send('download', true)
                str.on('progress', function (progress) {
                    let max = info.size
                    let currentValue = progress.transferred
                    let percent = Math.round((currentValue / max) * 100)

                    console.log(percent + "%");
                    win.webContents.send('download', [item.name, item.path, percent])
                    if(percent == 100){
                        downloading = false
                    }

                });
            })

            db.deleteRow('listdl', {'id': item.id}, (succ, msg) => {
                console.log(msg);
            });

        }, 200);

    });

}


async function downloadFromList(){

    let list = getDlList();

    if(list.length != 0 && !downloading) {
        downloading = true
        let dl = await downloadItems(list)
        dl.then(()=>{
            let tmpList = getDlList();
            tmpList.length == 0 ? downloading = false : downloadFromList()
        })
    }else if(list.length != 0 && downloading){
        setTimeout(()=>{
            downloadFromList()
        }, 500)
    }else{
        console.log("DL finished")
    }


}


ipcMain.handle('deleteVideo', (event, args) => {
    db.deleteRow('videos', {'url': args}, (succ, msg) => {
        return msg
    })
})


