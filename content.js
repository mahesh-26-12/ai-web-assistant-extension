chrome.runtime.onMessage.addListener((request,sender,sendResponse)=> {
    if(request.action === "getText"){
        let pageText = document.body.innerText;

        sendResponse({text: pageText});
    }
});