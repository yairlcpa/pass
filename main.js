// deno-lint-ignore-file no-var
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register("./sw.js")
//   .then((reg) => console.log("sw Registred", reg))
//   .catch((err) => console.log ("sw NOT Registred !", err));}

// -- GLOBAL VARIABLES -- //
let lsPass={}, myPass="", myList=[], myItem={}, path="root", cmPath="root", exitTimer, txtDB, isNewKey=false, passArr=[], keysArr=[], passItem={};
const itemKeys = ["id", "path", "type", "nameHe", "nameEn", "user", "password", "url", "notes"], keyEntries = itemKeys.slice(3);

// -- GLOBAL FUNCTIONS -- //
const cl = (txt) => console.log(txt);
const qs = (el, parent = document) => parent.querySelector(el);
const qsAll = (el, parent = document) => [...parent.querySelectorAll(el)];
const Getls = (ls) => JSON.parse(localStorage.getItem(ls))
const Setls = (ls) => localStorage.setItem(ls, JSON.stringify(lsPass))
const IsWindows = () => navigator.userAgentData.platform == "Windows"
const Run_Exit_Timer = () => {exitTimer = setTimeout(location.reload(), 300000);}

// -- API FUNCTIONS -- //
const Get = async (url) => {
  const res = await fetch(url); const data = await res.json(); return data;
}
const Post = async (url, payload) => {
  const myHeaders = new Headers();  myHeaders.append("Content-Type", "application/json");
  await fetch(url, {method: "POST", body: JSON.stringify(payload), headers: myHeaders});
}
const Put = async (url, payload) => {
  const res = await Get(url);  
  const newPl = {...res, ...payload}
  await Post(url, newPl);
}
const Delete_Key = async (url, key) => {
  const res = await Get(url);
  delete res[key];
  await Post(url, res);
}
const Delete_Basket = async (url) => {
  await fetch(url, {method: "DELETE"})
}

// -- ELEMENTS FUNCTIONS -- //
const Page   = (pgArr) => pgArr.map(p => qs(p).classList.toggle("page-hide"));
const Mask   = (pg) => qs("#"+pg).classList.toggle("mask-show")
const Modal  = (title="",body="", confirm="") => { qs("#modal-title").innerHTML=title; qs("#modal-body").innerHTML=body;qs("#modal-confirm").innerHTML=confirm; Mask("modal"); qs(".modal-box").classList.toggle("modal-show"); }
const Action = (tmpltId="foo") => {Mask("action"); qs(".action").classList.toggle("action-show"); qs(".action").innerHTML=qs("#"+tmpltId).innerHTML}
const SideBar = (tmpltId="foo") => {Mask("sidebar"); qs(".sidebar").classList.toggle("sidebar-show"); qs(".sidebar").innerHTML=qs("#"+tmpltId).innerHTML}
const Msgbox = (title="msgbox title",txt="msgbox txt") => { Mask('msgbox'); qs(".msgbox").classList.toggle("msgbox-show"); qs(".msgbox").classList.remove('text-danger'); qs("#msgbox-title").innerHTML=title; qs("#msgbox-body").innerHTML=txt; }
const Warning = (title="msgbox title",txt="msgbox txt") => { Mask('msgbox'); qs(".msgbox").classList.toggle("msgbox-show"); qs(".msgbox").classList.add('text-danger'); qs("#msgbox-title").innerHTML=title; qs("#msgbox-body").innerHTML=txt; }
const Toast  = (txt) => {qs(".toast-msg").innerHTML = txt; qs(".toast-box").classList.toggle("toast-show"); setTimeout(() => qs(".toast-box").classList.toggle("toast-show"), 2000); } 
const Goto_Page = (pg) => { qsAll('.pg').map(p =>p.classList.add('page-hide')); qs('#'+pg).classList.remove('page-hide') }

// -- DATABASE FUNCTIONS -- //
const EncryptDB = (data, pass) => CryptoJS.AES.encrypt(JSON.stringify(data), pass).toString();
const DecryptDB = (txt,pass) => JSON.parse(CryptoJS.AES.decrypt(txt, pass).toString(CryptoJS.enc.Utf8))
const SortDB = () => {DB.sort((a, b) => a.nameHe.localeCompare(b.nameHe)); DB.sort((a, b) => a.type.localeCompare(b.type));}
const Generate_NewID = () => '____-____-____'.split('').map(i => i.replace("_",String.fromCharCode(Math.floor(Math.random()*26)+65))).join('')
const Generate_Password = (n=10) => {txt='ABCDEFGHIJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz23456789'; return '_'.repeat(n).split('').map(i => i.replace("_",txt[Math.floor(Math.random()*66)])).join('')}
const GetFolders = (pth) => DB.filter(p => p.path==pth && p.type=="folder");
const GetItem = (id) => DB.filter(p => p.id==id)[0];
const NewItem = (newVals) => {newItem={}; newVals.map((k,i) => newItem[itemKeys[i]]=k); return newItem}
const AddItem = (newVals) => {newItem={}; newVals.map((k,i) => newItem[itemKeys[i]]=k); DB.push(newItem);};
const DeleteKey = (id) => DB = DB.filter(p => p.id != id);
const DeleteFolder = (pth) => DB = DB.filter(p => !p.path.includes(pth));

// -- APP MISC FUNCTIONS -- //
const Theme_Mode = () => {
  lsPass.theme = document.body.getAttribute("data-bs-theme") == "dark" ? "light" : "dark"
  document.body.setAttribute("data-bs-theme", lsPass.theme); Setls();
}
const Toggle_Pass_Type = (e) => {
  let type = e.previousElementSibling.getAttribute('type') == 'password' ?'text' : 'password';
  e.previousElementSibling.setAttribute('type', type);
  e.classList.toggle('bi-eye'); e.classList.toggle('bi-eye-slash'); 
}
const Save_To_File = (fileName, db) => {
  if (qs(".modal-box").classList.contains('modal-show')) Modal();
  let file = new Blob([db], { type:"text/json;charset=utf-8,"});
  let blobURL = URL.createObjectURL(file); let a = document.createElement("a");
  a.href = blobURL; a.download = fileName; a.style.display = 'none';
  document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(blobURL); a.remove(); }, 1000);
}
const Save_DB = async() => {
  let pass = EncryptDB(JSON.stringify(DB),myPass)
  try { await Post(lsPass.url,{pass}); Toast("הקובץ נשמר")}
  catch {
    let confirm = `<span class="text-danger" onclick="Save_To_File('localPass.txt', '${pass}')">אישור</span>`
    Modal('<span class="text-danger"> שגיאה </span>', '<span class="text-danger"> השרת אינו מגיב <br> שמור קובץ מקומית </span>', confirm);  
  }
}
const Copy_Text = (e) => {
  navigator.clipboard.writeText(qs(e).value); 
  if (navigator.vibrate) navigator.vibrate(50);
  Toast("הטקסט הועתק"); 
}
const Keyboard_Enter_Click = (e) => {
  if (qs("#page-login").className.search("page-hide") == -1) {e.preventDefault(); Login_Click()};
}
const Keyboard_Search_Click = (e) => {
  if (qs("#page-main").className.search("page-hide") == -1) {e.preventDefault(); Search_Btn_Click()};
}

// -- START APP -- //
Check_Auth()
async function Check_Auth(){
  if (Getls("lsPass")==null) {lsPass.theme="dark"; lsPass.url=""; Setls('lsPass')}
  lsPass = Getls('lsPass'); url = lsPass.url; document.body.setAttribute("data-bs-theme", lsPass.theme); 
  try{ Obj = await Get(url); txtDB=Obj.pass; StartApp()}
  catch{ Goto_Page('page-auth')}
}
function _Read_Key_File(f){
  const file = f.files[0], reader = new FileReader(); reader.readAsText(file);
  reader.onload = () => {
    const pKey = reader.result;
    url=`https://my-baskets.deno.dev/${pKey}/pass`;
    lsPass.url = url; Setls('lsPass'); location.reload();}
}
async function StartApp(){
  // document.body.onfocus = () => {clearTimeout(exitTimer); navigator.clipboard.writeText("");}
  // document.body.onblur = () => { Run_Exit_Timer();}
  document.body.addEventListener("keydown", (e)=> {
    if (e.key == "Enter") Keyboard_Enter_Click(e);
    if (e.ctrlKey && e.key=="כ" || e.ctrlKey && e.key=="f" || e.ctrlKey && e.key=="F") Keyboard_Search_Click(e);
  });  
  Goto_Page("page-login"); qs("#main-password").focus();
}

// -- LOGIN PAGE-- //
function Import_Files(){
  let confirm = `<span onclick="Modal()">יציאה</span>`
  Modal('טען קובץ נתונים',qs('#modal-load-file').innerHTML, confirm); 
}
function Import_Local_File(f){
  let file = f.files[0]; let reader=new FileReader();
  reader.readAsText(file); reader.onload = () => {txtDB = reader.result; Modal(); Toast("קובץ נטען בהצלחה");}
}
async function Import_From_Dropbox_Link(f){
  let file = f.files[0]; let reader=new FileReader();
  reader.readAsText(file); reader.onload=()=> { 
    linkTxt=reader.result; lsPass.dropbox=linkTxt; Setls();  Fetch_DropBox();}
}
async function Fetch_DropBox(){
  let drp = await fetch (lsPass.dropbox); txtDB = await drp.text(); 
  Modal(); Toast("קובץ נטען בהצלחה");
}
function Create_NewDB(){
  let title = `<span class="text-danger">שים לב !</span>`
  let confirm = `<span class="text-danger" onclick="Create_NewDB_Confirm()">אישור</span>`
  let body = `<div class="text-danger">קובץ נתונים חדש ידרוס את הקיים <br> האם להמשיך ? </div>`;
  Modal();Modal(title,body, confirm);
}
function Create_NewDB_Confirm(){
  DB = [NewItem([Generate_NewID(), path, "key", "חדש","New","","","",""])];
  let confirm = `<span onclick="Change_Password_Confirm('newdb')">אישור</span>`
  Modal();Modal('סיסמה חדשה',qs('#modal-change-password').innerHTML, confirm);
}
async function Login_Click(){
  myPass = qs("#main-password").value;
  try {DB = JSON.parse(DecryptDB(txtDB,myPass)); SortDB(); }
  catch {Warning ('שגיאה',"סיסמה שגויה"); return }
  qs("#main-password").value=''; Fill_Pass_List(); Goto_Page('page-main')
}

// -- MAIN PAGE -- //
function Main_Back_Click(){
  path = path.slice(0,path.lastIndexOf("/")); 
  Fill_Pass_List();
}
function Main_Item_Click(e) {
  myItem = DB.filter(c => c.id==e)[0];
  if (myItem.type=="folder") {path+=`/${myItem.nameHe}`; Fill_Pass_List()}
  else {KeyForm_Show();}
}
function Fill_Pass_List() {
  myList = DB.filter(c => c.path==path); let litxt=""; qs("#pass-list").innerHTML=''
  qs("#main-title").innerText = path.slice(path.lastIndexOf("/")+1).replace("root","ראשי"); 
  if(path=="root") {qs("#main-back-btn").classList.add("d-none"); qs("#main-exit-btn").classList.remove("d-none")}
  else {qs("#main-back-btn").classList.remove("d-none"); qs("#main-exit-btn").classList.add("d-none")}
  for (let i of myList){
    if(i.user == "") i.user="-";   
    if(i.type == "key") {litxt += qs('#li-key').innerHTML.replaceAll('~id~',`${i.id}`).replace('~user~',`${i.user}`).replace('~name~',`${i.nameHe}`)}
    else{
      let childPath = `${path}/${i.nameHe}`; let childs = DB.filter(c => c.path==childPath).length;
      litxt += qs('#li-folder').innerHTML.replaceAll('~id~',`${i.id}`).replace('~childs~',`${childs}`).replace('~name~',`${i.nameHe}`); 
    }}
  qs("#pass-list").innerHTML += litxt
}
function Search_Btn_Click() { 
  let keysArr = DB.filter(c => c.type=='key'); 
  qs("#search-input").value = ""; qs("#search-input").focus();
  qs("#search-list").innerHTML = ""; qs("#search-list").scrollTop=0;
  if(keysArr.length>20){ Fill_Search_List(keysArr.slice(0,20)); setTimeout(_=>Fill_Search_List(keysArr.slice(20)),50);}
  else Fill_Search_List(keysArr)
  Goto_Page('page-search');
}

// -- MAIN MENU -- //
function Change_Password_Click(){
  SideBar(); let confirm = `<span onclick="Change_Password_Confirm('')">אישור</span>`
  Modal('סיסמה חדשה',qs('#modal-change-password').innerHTML, confirm)
}
function Change_Password_Confirm(sndr){
  let np=qs('#new-password').value; cp=qs('#confirm-password').value
  if (np!=cp) Warning('שגיאה','סיסמאות אינן תואמות<br>נסה שוב')
  else if (np=="") Warning('שגיאה','לא הוזנה סיסמה<br>נסה שוב')
  else {
    myPass=np; np=""; cp=""; Modal(); Save_DB()
    if (sndr!='newdb') Toast("סיסמה הוחלפה בהצלחה");
    else {Fill_Pass_List(); Goto_Page('page-main'); Toast("קובץ נוצר בהצלחה");}
  }
}
function Share_PassDB(){
  SideBar();
  let passData = EncryptDB(JSON.stringify(DB),myPass);
  const shareData = {title: "Pass", text: passData};
  navigator.share(shareData);
}
function Export_Json_Click(){
  let title='<div>יצוא לקובץ JSON</div>'
  let body = `<div class="text-danger"> שים לב ! <br> הסיסמאות בקובץ JSON אינן מוצפנות <br> אל תשאיר את הקובץ ללא הצפנה <br> האם להמשיך ? </div>`
  let confirm = `<span class="text-danger" onclick="Export_Json_Confirm()">אישור</span>`
  SideBar(); Modal(title,body,confirm)
}
function Export_Json_Confirm(){
  Modal(); Save_To_File('Pass.json',JSON.stringify(DB))
}
function SaveDb(){ SideBar(); Save_DB(); Toast('קובץ נשמר בהצלחה') }
function ExitApp(){ SideBar(); location.reload(); }

// -- FAB ADD ITEM -- //
function Add_New_Folder(){
  Action(); let modalOk = `<span onclick="Add_Folder_Confirm()">אישור</span>`
  Modal('הוסף ספרייה',qs('#modal-add-folder').innerHTML, modalOk)
}
function Add_Folder_Confirm(){
  let itemVals = [Generate_NewID(),path,"folder",qs('#add-folder').value,"","","","",""];
  AddItem(itemVals); 
  Toast("הספריה נוספה בהצלחה"); Modal(); SortDB(); Fill_Pass_List(); Save_DB(); 
}
function Add_New_Key(){
  isNewKey=true; myItem = NewItem([Generate_NewID(), path, "key", "חדש","New","","","",""]);
  Action(); Toggle_Entries(); KeyForm_Show()
}

// -- KEY FORM -- //
function KeyForm_Show(){
  qsAll(".key-name").map(k => k.innerText=myItem.nameHe); 
  for (i of keyEntries) qs("#key-"+i).value = myItem[i]; 
  if(myItem.notes==null) qs("#key-notes").value = "";
  Mask('key-form-modal'); qs("#key-form-body").classList.toggle("msgbox-show"); 
}
function KeyForm_Back_Click(){
  Mask('key-form-modal'); qs("#key-form-body").classList.toggle("msgbox-show"); 
}
function Toggle_Entries(){
  qsAll('#key-form-title').map(t => t.classList.toggle('d-none'));  qsAll('.key-entry').map(k => k.disabled=!k.disabled)
}
function KeyEntry_Edit_Save(){
  let i = DB.findIndex(o => o.id==myItem.id)
  if(isNewKey){
    isNewKey=false; let newKey = {}
    for (j of keyEntries) myItem[j] = qs("#key-"+j).value;
    DB.push(myItem); KeyForm_Back_Click()
    }
  else 
    {for (j of keyEntries) DB[i][j] = qs("#key-"+j).value;}
  Toggle_Entries(); Fill_Pass_List(); Save_DB();
}
function KeyEntry_Edit_Cancel(){
  if (isNewKey) {isNewKey=false; KeyForm_Back_Click(); Fill_Pass_List(); }
  Toggle_Entries(); 
}
function Generate_New_Password(){
  if(qs("#key-password").disabled == false) qs('#key-password').value = Generate_Password(10)
}
function Open_Url(){open(myItem.url)}
function KeyEntry_Edit_Click(){Toggle_Entries()}

// -- ITEM MENU -- //
function Item_Menu_Click(e){
  myItem = DB.filter(c => c.id==e)[0];
  let keyFolder = myItem.type=="folder" ?"תיקיית: " :"מפתח: "
  Action("action-item-menu");  
  qs("#item-menu-title").innerText = keyFolder + myItem.nameHe
}
function Action_Copy_Item_Click(){
  Action();
  let confirm = `<span onclick="Copy_Item_Confirm()">אישור</span>`
  Modal('ראשי',qs('#modal-folders-list').innerHTML, confirm)
  qs('#folders-ul').innerHTML = Fill_Folder_List();
}
function Action_Move_Item_Click(){
  Action();
  let confirm = `<span onclick="Move_Item_Confirm()">אישור</span>`
  Modal('ראשי',qs('#modal-folders-list').innerHTML, confirm)
  qs('#folders-ul').innerHTML = Fill_Folder_List();
}
function Action_Rename_Item_Click(){
  Action(); 
  if (myItem.type=="key") Msgbox("שינוי שם","שינוי שם מפתח <br> נעשה בחלון עריכת מפתח")
  else {
    let modalOk = `<span onclick="Rename_Folder_Confirm()">אישור</span>`
    Modal('שינוי שם ספריה',qs('#modal-rename-folder').innerHTML, modalOk) }
}
function Action_Delete_Item_Click(){
  let title = '<div class="text-danger">מחיקת פריט</div>';
  if (myItem.type=="key") 
    bdy = `<div class="text-danger">האם אתה בטוח <br> שברצונך למחוק פריט זה ? </div>`;
  else
    bdy = `<div class="text-danger">זהירות ! <br> מחיקת ספריה תמחוק גם את ספריות המשנה ! <br> האם להמשיך ? </div>`;
  let confirm = `<span class="text-danger" onclick="Delete_Item_Confirm()">אישור</span>`;
  Action(); Modal(title,bdy,confirm)
}
function Folder_Selected(fldr){
  cmPath += `/${fldr}`; 
  qs("#modal-title").innerHTML=cmPath.replace("root","ראשי");
  qs('#folders-ul').innerHTML = Fill_Folder_List();
}
function Folder_Back(){
  if(cmPath != "root") cmPath=cmPath.slice(0,cmPath.lastIndexOf("/")); 
  qs("#modal-title").innerHTML=cmPath.replace("root","ראשי");
  qs('#folders-ul').innerHTML = Fill_Folder_List();
}
function Fill_Folder_List(){
  if(cmPath=='root') txt=''; else txt= `<li class="list-group-item rounded-3 fs-5 pointer" onclick="Folder_Back()"><b class="bi-arrow-90deg-up float-end"></b></li>`; 
  for (i of GetFolders(cmPath)) 
    txt+=`<li class="list-group-item rounded-3 fs-5 pointer" onclick="Folder_Selected('${i.nameHe}')">${i.nameHe}</li>`
  return txt
}
function Copy_Item_Confirm(){
  let oldPath = myItem.path+'/'+myItem.nameHe; let newPath = cmPath+'/'+myItem.nameHe; 
  if(myItem.path==cmPath){Warning("שגיאה","פריט זהה קיים בספריה זו"); return}
  if (myItem.type=='key'){
    let newKey = structuredClone(GetItem(myItem.id));
    newKey.id=Generate_NewID(); newKey.path=cmPath; DB.push(newKey); 
  } else {
    let copyArr = DB.filter(c => c.path.search(oldPath)==0).map(el => ({...el}));
    let newFolder=structuredClone(myItem); newFolder.id=Generate_NewID(); newFolder.path=cmPath; copyArr.push(newFolder)
    copyArr.forEach(i => {i.id=Generate_NewID(); i.path=i.path.replace(oldPath,newPath); DB.push(i);});
  }
  myItem={}; path=cmPath; cmPath='root'; Modal(); SortDB(); Fill_Pass_List(); Save_DB(); Toast("הפריט הועתק בהצלחה");
}
function Move_Item_Confirm(){
  let oldPth = myItem.path+'/'+myItem.nameHe, newPth = cmPath+'/'+myItem.nameHe; 
  if (cmPath==myItem.path) {Warning("שגיאה!","הפריט כבר נמצא בתיקייה זו"); return;}
  if (myItem.type=="folder") {
    if (cmPath.search(oldPth)==0) {Warning("שגיאה!","לא ניתן להעביר את התיקייה לתוך עצמה"); return;}
    if (DB.filter(o => o.path==cmPath).filter(n => n.nameHe==myItem.nameHe).length>0)
      {Warning("שגיאה!","שם זהה כבר קיים בתיקייה זו<br>אנא בחר תיקייה אחרת"); return;}
    DB.forEach((p,i) => { if (p.path.search(oldPth)==0) DB[i].path=DB[i].path.replace(oldPth,newPth) })
    }
  GetItem(myItem.id).path = cmPath
  myItem={}; path=cmPath; cmPath='root'; Modal(); SortDB(); Fill_Pass_List(); Save_DB(); Toast("הפריט הועבר בהצלחה");
}
function Rename_Folder_Confirm(){
  let oldPth = myItem.path+"/"+myItem.nameHe, newPth = myItem.path+"/"+qs('#rename-folder').value
  DB.forEach((p,i) => {if (p.path.search(oldPth)==0) DB[i].path = DB[i].path.replace(oldPth,newPth) })
  GetItem(myItem.id).nameHe = qs('#rename-folder').value
  Modal(); SortDB(); Fill_Pass_List(); Save_DB(); Toast("שם פריט שונה בהצלחה");
}
function Delete_Item_Confirm(){
  if(myItem.type=="folder") DeleteFolder(myItem.path+"/"+myItem.nameHe)
  DeleteKey(myItem.id); 
  Modal(); SortDB(); Fill_Pass_List(); Save_DB(); Toast("הפריט נמחק בהצלחה");
}

// -- SEARCH -- //
function Fill_Search_List(keys){
  let txt=''
  if (qs("#search-input").value == "")  qs("#clean-seach-input").classList.add("invisible");
  else qs("#clean-seach-input").classList.remove("invisible");
  for (let i of keys)
    txt +=`
      <div id="${i.id}" class="flex-column px-2 pt-1 pointer" onclick="Search_Key_Click(this.id)">
        <i>${i.nameHe}</i>
        <div class="px-1 text-secondary" style="font-size:0.75rem">${i.path.replace("root/","").replaceAll("/"," - ")}</div>
      </div>`
  qs("#search-list").innerHTML = txt
}
function Filter_Search_List() {
  let sEn=qs("#search-input").value.toUpperCase(), sHe=qs("#search-input").value.toUpperCase(); 
  let srcHe = DB.filter(c => c.type=='key' && c.nameHe.toUpperCase().includes(sHe) && qs("#search-input").value !="")
  let srcEn = DB.filter(c => c.type=='key' && c.nameEn.toUpperCase().includes(sEn));
  qs("#search-list").innerHTML = "";
  Fill_Search_List([...srcHe,...srcEn]);
}
function Search_Key_Click(id){
  myItem = DB.filter(c => c.id==id)[0]; 
  KeyForm_Show()
}
function Clean_Search_Input(){
  qs("#search-input").value = ""; qs("#search-input").focus();
  Filter_Search_List()
}
function Search_Back_Click(){
  Clean_Search_Input();Goto_Page('page-main');
}
