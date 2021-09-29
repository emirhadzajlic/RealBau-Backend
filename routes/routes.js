const routes = require("express").Router();
const mydb = require('../db/index');
const auth = require('../auth/auth');
const bcrypt = require('bcrypt');
const { readUserRole } = require("../db/index");
const XLSX = require('xlsx-color');
const path = require("path");
const formidable = require('formidable');
const fs = require('fs');
//const bcrypt = require("bcrypt");
//const crypto = require("crypto");
//const nodemailer = require("nodemailer");

routes.post("/proba", async (req,res) => {
    var email = await mydb.readSession(req.headers.authorization)
    var role = await readUserRole(email)
    var columns = await mydb.readColumns(role.role)
    res.send(await mydb.proba(req.body,columns.columns))
})

routes.post("/updateDP", async (req, res) => {
    res.send(await mydb.updateDP(req.body))
})

routes.post('/updateData', async (req, res) => {
    var name = await mydb.readUserName(await mydb.readSession(req.headers.authorization));
    let fullName = name.ime + " " + name.prezime;
    if(req.body.COMMENT != ""){
        req.body.COMMENT = fullName + " " + req.body.COMMENT;
    }
    res.send(await mydb.updateData(req.body))
})
routes.post('/getData', async (req, res) => {
    res.send(await mydb.getData(req.body));
})

routes.post("/tableAll", async (req,res) => {
    var email = await mydb.readSession(req.headers.authorization)
    var role = await readUserRole(email)
    var columns = await mydb.readColumns(role.role)
    res.send(await mydb.tableAll(columns.columns))
})

routes.post("/add", async (req,res) => {
    console.log(req.body)
    // console.log(JSON.stringify(req.body))
    res.send(await mydb.add(req.body));
})
routes.post('/auth', async (req, res) => {
    var userEmail = await mydb.readSession(req.headers.authorization);
    if(userEmail){
        var userRole = await mydb.readUserRole(userEmail);
        var columns = await mydb.readColumns(userRole.role);
        var name = new Object(await mydb.readUserName(userEmail));
        name.isAuth = true;
        name.role = userRole.role;
        name.columns = columns.columns
        res.send(name);
    } else {
        res.send({error: "Authorization failed!"});
    }
})

routes.post("/manage", async (req,res) => {
    let data = req.body
    for (let property in data){
        if(data[property] == "") {
          res.send({error:"Popunite polja!"})
        } 
      }
    if(data.newPassword !== data.newPasswordCheck){
        res.send({error:"Nove sifre se ne poklapaju!"})
    }
    const salt = await bcrypt.genSalt(10);
    data.newPassword = await bcrypt.hash(data.newPassword, salt);
    var email = await mydb.readSession(req.headers.authorization);
    res.send(await mydb.manage(req.body,email));
})

routes.post("/register", async (req,res) =>{
    req.body.forEach(e => {
        if(!e){
            res.send({error:"Provjerite da li sva polja popunjena!"})
        }
    });
    const salt = await bcrypt.genSalt(10);
    req.body[4] = await bcrypt.hash(req.body[4], salt);
    res.send(await mydb.register(req.body));
})

routes.post("/allAccounts", async (req,res) => {
    res.send(await mydb.getAccounts())
})

routes.post("/login", async(req,res) =>{
   
    var data = await mydb.login(req);
    if(!data.error){
        mydb.deleteSessionByEmail(req.body[0])
        var token = await auth.createToken({req,res}); 
        if(token != 0){
            await mydb.writeSession(token, req.body[0]);
        }
        res.send(token);
    } else {
        res.send(data)
    }

})
routes.get("/logout", async(req,res) =>{
    var check = await mydb.deleteSession(req.headers['authorization']);
    if(check){
        res.status(200)
        res.send({eror:false})
    }
})

routes.post("/deleteUser", async(req,res) => {
    res.send(await mydb.deleteUser(req.body.email))
})

routes.get("/test", async(req,res) => {
    req.session.isAuth = true
    res.send({authed:'authed'})
})
routes.post("/excelData", async(req, res) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        // console.log(files.file.type)
        if(files.file.type != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") res.send({error: "Molimo vas unesti excel file!"})
        var oldpath = files.file.path;
        var newpath = path.join(__dirname,"../",files.file.name);
        fs.rename(oldpath, newpath, async function (err) {
            if (err) throw err;
            else {
                res.send(await mydb.excelInsert(newpath)) //fali req.path
            }
        });
    });
    
})

routes.post("/downloadExcel", async(req, res) => {
    function fitToColumn(arrayOfArray) {
        return arrayOfArray[0].map((a, i) => ({ wch: Math.max(...arrayOfArray.map(a2 => a2[i] ? a2[i].toString().length : 0)) }));
    }
    let email = await mydb.readSession(req.headers.authorization);
    let role = await mydb.readUserRole(email)
    let columns = await mydb.readColumns(role.role);
    if(role.role == "ad" || role.role == "cc") columns.columns = "*";
    let data = await mydb.proba(req.body,columns.columns);
    if(role.role == "ad" || role.role == "cc") columns.columns = "ORDERDATE, ORDERID, PROJECTCODE, PROJECTNAME, AREAPOP, DP, CITY, TZIP, STREET, HAUSNUMMER, EINHEIT, TIEFBAUDatum, TIEFBAUFINISH, METER, TFVOM, FASERDatum, FFINISH, FVOM, ImDPgespleißt, DPFinish, DPGVom, POPFinish, HBDatum, HBTermin, HBCALLDATE, HAUSBDate, HBFinish, HBVOM, DP_1, MDATUM, MTERMIN, CALLMDate, MFINISH, MONTAZEDATUM, MVOM, Meßwert1, Meßwert2, ADATUM, AKTIVIRUNGTERMIN, AKTIVIRUNGFINISH, AKTIVIRUNGDATUM, AVOM, TDatum, TICKETTERMIN, TICKETFINISH, TICKETDATUM, TCALLDATE, TICKETVOM, COMMENT, CONNECTIONDATE, COMPLETIONDATE, ARSTATUS, PROVIDER, CO_ID, FIRSTNAME, NAME, PHONE, EMAIL, STATUS, BrojPoziva, MIHStatus, ServisPaket, ZUSAT, VermessungFinish, VermessungDatum, VermessungVom"
    columns = columns.columns.split(", ");
    let newData = [];
    newData.push(columns);
    data.forEach(row => {
        let rowToArray = []
        for (let column in row){
            if(column.toLowerCase().indexOf("datum") > -1 || column.toLowerCase().indexOf("date") > -1) {
                row[column] = row[column].substring(0,10);
            }
            rowToArray.push(row[column]);
        }
        newData.push(rowToArray);
    })
    var wb = XLSX.utils.book_new();
    wb.SheetNames.push("Data");
    wb.Sheets["Data"] = XLSX.utils.aoa_to_sheet(newData);
    wb.Sheets["Data"]['!cols'] = fitToColumn(newData);
    for(let field in wb.Sheets["Data"]){
        if(wb.Sheets["Data"][field]["v"] == "NE"){
            wb.Sheets["Data"][field].s = {
                fill: {
                    patternType: "solid",
                    // fgColor: { rgb: "990303" }
                    // fgColor: { rgb: "FF0000" }
                    // fgColor: { rgb: "EE0000" }
                    fgColor: { rgb: "EE2C2C"}
                }
            }
        } else if(wb.Sheets["Data"][field]["v"] == "DA"){
            wb.Sheets["Data"][field].s = {
                fill: {
                    patternType: "solid",
                    // fgColor: { rgb: "009900" }
                    fgColor: { rgb: "66CD00" }
                    // fgColor: { rgb: "76EE00" }
                }
            }
        }
    }
        
    XLSX.writeFile(wb, 'out.xlsx');

    res.sendFile('./out.xlsx', {root:path.join(__dirname, '../')});
})

routes.get('/user-list', function(req, res) {
    res.render('../views/user-list', { title: 'User List', userData: mydb.proba()});
});

routes.get("/email", async (req,res) => {
    let email = await mydb.readSession(req.headers.authorization)
    res.send({email});
})

routes.get("/roles", async (req, res) => {
    res.send(await mydb.getRoles())
})

routes.get("/columns", async (req, res) => {
    res.send(await mydb.getColumns())
})

routes.post("/addColumnToRole", async (req,res) => {
    res.send(await mydb.addColumnToRole(req.body.role,req.body.columnToAdd))
})

routes.post("/updateRoles", async (req, res) => {
    res.send(await mydb.updateRoles(req.body.role, req.body.columns))
})

module.exports = routes;