const {app, BrowserWindow, ipcMain} = require('electron')
const youtubedl = require('youtube-dl-exec')
const ytdl = require('ytdl-core');

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


function createWindow () {
    const win = new BrowserWindow({
        width: 1000,
        height: 720,
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
    ytdl.getBasicInfo(args).then((videoInfo)=>{

        let infos = new Object();

        infos.title = videoInfo.videoDetails.title;
        infos.url = videoInfo.videoDetails.video_url;
        infos.owner = videoInfo.videoDetails.ownerChannelName;
        infos.publishDate = videoInfo.videoDetails.publishDate;
        infos.lenght = videoInfo.videoDetails.lengthSeconds;

        if (db.valid('videos')) {
            db.getRows('videos', {
                url: infos.url
            }, (succ, result) => {
                if(result.length == 0){
                    db.insertTableContent('videos', infos, (succ, msg) => {
                        console.log("Success: " + succ);
                        out = msg
                    })
                }else{
                    out = "La vidéo existe déjà"
                }
            })
        }
    })



    return out;
});

ipcMain.handle('getList', (event, args) => {
    let list = []

    db.getAll('videos', (succ, data) => {
        list = data;
        console.log(succ)
    })

    return list

})


