const {ipcRenderer} = require('electron')



var buttonURL = document.querySelector("#validURL");
var buttonList = document.querySelector("#list");


var input = document.querySelector("#input")

buttonURL.addEventListener('click', ()=>{
    let url = input.value
    url != "" ? getVidInfos(url) : console.log("L'url n'est pas valide")
})

buttonList.addEventListener('click', ()=>{
    getVids()
})

function getVidInfos(url){
    ipcRenderer.invoke('getInfosFromUrl', url).then((rep) => {
        console.log(rep)
    })
}

function getVids(){
    ipcRenderer.invoke('getList', "ping").then((rep) => {
        console.log(rep)
    })
}
