const {ipcRenderer} = require('electron')



var buttonURL = document.querySelector("#validURL");
var buttonList = document.querySelector("#list");
var listView = document.querySelector('#listView')


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
        getVids();
    })
}

function getVids(){
    ipcRenderer.invoke('getList', "ping").then((rep) => {
        fillList(rep)

    })
}

getVids()
function fillList(list){
    let content = ""
    for (const i in list) {
        console.log(list[i])
        content +=
            '<li class="col-span-1 flex flex-col text-center bg-gray-800 rounded-lg shadow divide-x ">'+
                '<div class="flex-1 flex flex-col p-2">'+
                    '<div>'+
                        '<iframe class="w-full h-64 rounded-lg" src="https://www.youtube.com/embed/'+list[i].video_id+'" frameBorder="0"'+
                        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"'+
                        'allowFullScreen></iframe>'+
                    '</div>'+
                    '<div class="mt-2 flex justify-between">'+
                        '<button class="w-2/5 bg-transparent hover:bg-white text-white font-semibold hover:text-gray-700 py-2 px-4 border border-white hover:border-transparent rounded dl" data-url="'+list[i].url+'" data-title="'+list[i].title+'">\n' +
                            'Download'+
                        '</button>'+
                        '<span data-title="This is top tooltip" data-placement="top" class="bg-transparent text-gray-100 h-full text-center flex justify-center">'+
                            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="text-white h-7 w-7 cursor-pointer">' +
                                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' +
                            '</svg>'+
                        '</span>'+
                        '<button class="w-2/5 bg-transparent hover:bg-red-500 hover:text-white text-red-500 font-semibold py-2 px-4 border border-red-500 hover:border-transparent rounded delete" data-url="'+list[i].url+'">\n' +
                            'Supprimer' +
                        '</button>'+
                    '</div>'+
                '</div>'+
                '<div>'+
                    '<div class="-mt-px flex divide-x divide-gray-200">'+
                        '<div class="-ml-px w-0 flex-1 flex">'+

                        '</div>'+
                    '</div>'+
                '</div>'+
            '</li>'
    }

    listView.innerHTML = content

    let dl = document.querySelectorAll('.dl');
    let del = document.querySelectorAll('.delete')
    for (let i = 0; i < dl.length; i++) {
        dl[i].addEventListener('click', ()=>{
            openDlDialog(dl[i])
        })
        del[i].addEventListener('click', ()=>{
            deleteVideo(del[i])
        })
    }

}

function openDlDialog(elmt){
    console.log(elmt.dataset.url)
    console.log(elmt.dataset.title)
    ipcRenderer.invoke('downloadVideo', [elmt.dataset.url, elmt.dataset.title]).then((rep)=>{
        console.log(rep);
    })
}

function deleteVideo(elmt){
    ipcRenderer.invoke('deleteVideo', elmt.dataset.url).then((rep)=>{
        console.log(rep);
        getVids();
    })
}

ipcRenderer.on('download', (event, message) => {
    console.log(message) // Prints 'whoooooooh!'
})



