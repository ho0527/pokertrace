if(weblsget(WEBLSNAME+"signin")){
	href("main.html")
}

const firebaseConfig = {
	apiKey: "AIzaSyAVLLnEjbixngmPbHBp2UIlB52cn2qN9xQ",
	authDomain: "pokertrace.firebaseapp.com",
	projectId: "pokertrace",
	storageBucket: "pokertrace.firebasestorage.app",
	messagingSenderId: "527832274204",
	appId: "1:527832274204:web:8477f682b879a5b31c96d9",
	measurementId: "G-PQFSKC6SL4"
}

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

onclick("#signin",function(element,event){
    let provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Firebase 登入成功，正在取得 Token...");
            return result.user.getIdToken();
        })
        .then((idtoken) => {
            // 將 Token 傳送到 Django 後端
            return fetch(AJAXURL + "signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
					idtoken: idtoken
			})
            })
        })
        .then(res => res.json())
        .then(data => {
            if(data["success"]){
                weblsset(WEBLSNAME+"signin", true)
                weblsset(WEBLSNAME+"token", data["data"]["token"])
                weblsset(WEBLSNAME+"uid", data["data"]["uid"])
                weblsset(WEBLSNAME+"email", data["data"]["email"])
                weblsset(WEBLSNAME+"name", data["data"]["name"])
                weblsset(WEBLSNAME+"picture", data["data"]["picture"])
                href("main.html")
            } else {
                innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
            }
        })
        .catch(err => {
            innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
        })
})

// onsubmit("#form",function(element,event){
// 	event.preventDefault()

// 	domgetid("submit").disabled=true

// 	ajax("POST",AJAXURL+"signin",function(event,data){
// 		if(data["success"]){
// 			alert("登入成功")
// 			weblsset(WEBLSNAME+"signin",true)
// 			weblsset(WEBLSNAME+"token",data["data"]["token"])
// 			weblsset(WEBLSNAME+"userid",data["data"]["userid"])
// 			weblsset(WEBLSNAME+"permission",data["data"]["permission"])
// 			weblsset(WEBLSNAME+"name",data["data"]["name"])
// 			href("main.html")
// 		}else{
// 			innertext("#error",ERRORLIST[data["data"]]||"未知錯誤",false)
// 			domgetid("submit").disabled=false
// 		}
// 	},str({
// 		"username": getvalue("username"),
// 		"password": getvalue("password")
// 	}))
// })