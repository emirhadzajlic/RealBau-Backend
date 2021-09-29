const mysql = require('mysql');
const reader = require('xlsx');
const bcrypt = require('bcrypt');
const fs = require('fs');

require('dotenv').config();


/*const options = {
    connectionLimit: 10,
    host:"remotemysql.com",
    user:"zTTn4mC4al",
    password:process.env.DATABASE_PASS,
    database:"zTTn4mC4al",
    port: 3306
}*/

/*const options = {
    connectionLimit: 10,
    host:"sql11.freemysqlhosting.net",
    user:"sql11434932",
    password:process.env.DATABASE_PASS,
    database:"sql11434932",
    port: 3306,
}*/


const options = {
    connectionLimit: 10,
    host:"localhost",
    user:"root",
    //password:process.env.DATABASE_PASS,
    database:"projekat",
    port: 3307
}

var con = mysql.createPool(options);

let mydb = {};

mydb.writeSession = async ({token}, email) => {
    return new Promise((resolve , reject) => {
        con.query("INSERT INTO sessions VALUES (?, ?)",[token,email], (err, results) => {
            if(err) {
                reject(err)
                console.log(err)
            } else {
                resolve({session: true})
            }
        })
    })
}

mydb.deleteSession = (token) => {
    return new Promise((resolve, reject) => {
        con.query("DELETE FROM sessions WHERE token = ?",token,(err, results) => {
            if(err) reject(err)
            else {
                resolve(true)
            }
        })
    })
}

mydb.deleteSessionByEmail = (email) => {
    return new Promise((resolve, reject) => {
        con.query("DELETE FROM sessions WHERE email = ?",email,(err, results) => {
            if(err) reject(err)
            else {
                resolve(true)
            }
        })
    })
}

mydb.readSession = (token) => {
    return new Promise((resolve, reject) => {
        con.query("SELECT email FROM sessions WHERE token = ?", token,(err,results) => {
            if(err) reject(err)
            else {
                if(results.length > 0) resolve(results[0].email)
                else resolve(false)
            }
        })
    })
}

mydb.readUserName = (email) => {
    return new Promise((resolve, reject) => {
        con.query("SELECT ime, prezime FROM users WHERE email=?", email, (err,results) => {
            if (err) reject(err)
            else resolve(results[0])
        })
    })
}

mydb.readUserRole = (email) => {
    return new Promise((resolve, reject) => {
        con.query("SELECT role FROM users WHERE email=?", email, (err, results) => {
            if(err) reject(err)
            else resolve(results[0])
        })
    })
}

mydb.readColumns = (role) => {
    return new Promise((resolve, reject) => {
        con.query("SELECT columns FROM rolovi WHERE role=?", role, (err, results) => {
            if(err) reject(err)
            else {
                resolve(results[0])
            }
        })
    })
}

mydb.updateDP = (data) => {
    return new Promise((resolve, reject) => {
        con.query(`UPDATE korisnici SET DP = "${data.DP}" WHERE ORDERID = "${data.ORDERID}"`, (err, results) => {
            if(err) reject(err)
            else {
                resolve(results)
            }
        })
    })
}

mydb.proba = (data,columns) => {
    let query = `SELECT ${columns} FROM korisnici `;
    let i=0;
    for(const property in data){
        if(i==0){
            if(data[property]){
                query += `WHERE ${property}="${data[property]}"`
                // console.log(query)
                i++;
            }
        }else{
            if(data[property]){
                query += ` AND ${property}="${data[property]}"`
                // console.log(query)
            }
        }
    }
    return new Promise((resolve, reject) => {
        con.query(query,columns,
        (err, results) => {
            if (err) reject(err)
            else resolve(results)
        })
    })
}

mydb.updateData = (data) => {
    // console.log(data.TIEFBAUDatum)
    // console.log(data.FIRSTNAME)
    // console.log(data.NAME)

    let query = `UPDATE korisnici SET `;
    let queryWhere = ` WHERE ORDERID="${data.ORDERID}"`;
    let i=0;
    for(const property in data){
        if(i==0){
            if(data[property]){
                // console.log(property)
                if(property==='COMMENT') query += `COMMENT = concat(COMMENT, '; ', '${data[property]}')`
                else query += `${property}="${data[property]}"`
                // console.log(query)
                i++;
            }
        }else{
            if(data[property]){
                // console.log(property)
                if(property==='COMMENT') query += `, COMMENT = concat(COMMENT, '; ', '${data[property]}')`
                else query += `, ${property}="${data[property]}"`
                // console.log(query)
            }
        }
    }
    query+=queryWhere;

    return new Promise((resolve, reject) => {
        con.query(query, (err, results) => {
            if (err) reject(err)
            else resolve(results)
        })
    })
}

mydb.tableAll = (columns) => {
    let query = `SELECT ${columns} FROM korisnici `;
    return new Promise((resolve, reject) => {
        con.query(query, (err, results) => {
            if (err) reject(err)
            else {
                resolve(results)
            }
        })
    })
}

mydb.manage = async (data,email) => {
    return new Promise((resolve, reject) => {
        con.query("SELECT password FROM users WHERE email=?", email, (err, results) => {
            bcrypt.compare(data.password, results[0].password, (err, same) => {
                if(err) reject(err);
                if(same) {
                    con.query("UPDATE users SET password=? WHERE email=?",[data.newPassword, email], (err, results) => {
                        if (err) reject(err)
                        else{
                            resolve({info:"Podaci uspjesno izmijenjeni!"})
                        } 
                    })
                }
                else resolve({error:"Netacan password!"});
            });
        });
    })
}

mydb.all = () => {
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM users`, (err, results) => {
            if (err) reject(err)
            else resolve(results)
        })
    })
}

mydb.register = async (data) => {
    data.splice(5);
    var name = await mydb.readUserName(data[2]);
    return new Promise((resolve, reject) => {
        if(name == undefined){
            con.query(`INSERT INTO users (ime, prezime, email, role, password) VALUES(?)`,
            [data],(err, result)=> {
                if (err) reject(err)
                else resolve({info:"Nalog je uspjesno dodat!"})
            })
        } else {
            resolve({error:"Nalog sa email adresom vec postoji!"});
        }
        
    })
}

 mydb.login = (data) => {    
    return new Promise((resolve, reject) => {
        data.body.forEach(e => {
            if(e == "") resolve({error:"Popunite polja!"});
        }); 
        con.query(`SELECT * FROM users WHERE email=?`, data.body[0], 
        (err, results) =>{
            if (err) reject(err)
            else if(results[0] !== undefined) {
                bcrypt.compare(data.body[1], results[0].password, (err,same) => {
                    if(err) reject(err)
                    if(same) resolve(results[0])
                    else resolve({error:"Pogrešna šifra!"})
                });
            } else {
                resolve({error: "Pogrešan email!"})
            }
        })
    })
 }

mydb.getAccounts = () => {
    return new Promise((resolve, reject) => {
        con.query("SELECT ime, prezime, email, role FROM users", (err, results) => {
            if(err) reject(err)
            else resolve(results)
        })
    })
}

mydb.deleteUser = (email) => {
    return new Promise((resolve, reject) => {
        con.query("DELETE FROM users WHERE email=?", email, (err, results) => {
            if(err) reject(err)
            else resolve(results)
        })
    })
}

mydb.getData = (data) => {
    return new Promise((resolve, reject) => {
        con.query(`SELECT HBDatum, HBTermin, HBCALLDATE, HAUSBDate, HBVOM, TIEFBAUDatum, METER, TFVOM, FASERDatum, FVOM, MDATUM, MTERMIN, MVOM, CALLMDate, MONTAZEDATUM, ADATUM, AKTIVIRUNGTERMIN, AKTIVIRUNGDATUM, AVOM, VermessungDatum, VermessungVom, TDatum, TICKETTERMIN, TICKETDATUM, TCALLDATE, TICKETVOM, ServisPaket FROM korisnici WHERE ORDERID="${data.ORDERID}"`, (err, results) => {
            if (err) reject(err)
            else {
                resolve(results[0])
            }
        })
    })
}

/*mydb.excelInsert = () => { //putanja fajla
    return new Promise((resolve, reject) => {

        const file = reader.readFile('data/customers.xlsx') //ovdje je unesemo
        let data = []
        const sheets = file.SheetNames
        
        for(let i = 0; i < sheets.length; i++)
        {
        const temp = reader.utils.sheet_to_json(
                file.Sheets[file.SheetNames[i]])
        temp.forEach((res) => {
            data.push(res)
        })
        }

        for (let i = 50; i < 85; i++) { // i < data.length
    
            con.query(`INSERT INTO korisnici (FIRSTNAME, NAME, PHONE, EMAIL, CO_ID, CITY, STREET, HAUSNUMMER, DP, AREAPOP, TZIP, TFVOM, FVOM, DPGVom, HBVOM, MVOM, AVOM, TIEFBAUFINISH, FFINISH, DPFinish, POPFinish, HBFinish, MFINISH, AKTIVIRUNGFINISH) VALUES ("${data[i].FIRSTNAME}", "${data[i].NAME}", "${data[i].PHONE}", "${data[i].EMAIL}", "${data[i].CO_ID}", "${data[i].CITY}", "${data[i].STREET}", "${data[i].HAUSNUMMER}", "${data[i].DP}", "${data[i].AREAPOP}", "${data[i].TZIP}", "${data[i]['TIEFBAU Vom']}", "${data[i]['F VOM']}", "${data[i]['DPG Vom']}", "${data[i]['HB VOM']}", "${data[i]['M VOM']}", "${data[i]['A VOM']}", "${data[i]['TIEFBAU FINISH']}", "${data[i]['F FINISH (x)']}", "${data[i]['DP Finish (X)']}", "${data[i]['POP Finish (X)']}", "${data[i]['HB Finish (X)']}", "${data[i]['M FINISH (X)']}", "${data[i]['AKTIVIRUNG FINISH (X)']}")`, (err, results) => {
                if (err) reject(err)
                else if(i==84) resolve(results) // i==data.length-1
            })
            
        }
    })
}*/

mydb.excelInsert = (fileTo) => { //putanja fajla
    function ExcelDateToJSDate(serial) {
        var utc_days  = Math.floor(serial - 25569);
        var utc_value = utc_days * 86400;                                        
        var date_info = new Date(utc_value * 1000);
     
        var fractional_day = serial - Math.floor(serial) + 0.0000001;
     
        var total_seconds = Math.floor(86400 * fractional_day);
     
        var seconds = total_seconds % 60;
     
        total_seconds -= seconds;
     
        var hours = Math.floor(total_seconds / (60 * 60));
        var minutes = Math.floor(total_seconds / 60) % 60;
     
        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
     }
    return new Promise((resolve, reject) => {

        const file = reader.readFile(fileTo)
        let data = []
        const sheets = file.SheetNames
        for(let i = 0; i < sheets.length; i++)
        {
        const temp = reader.utils.sheet_to_json(
                file.Sheets[file.SheetNames[i]])
        temp.forEach((res) => {

            res.order_Date = ExcelDateToJSDate(res.order_Date)
            res.completion_date = ExcelDateToJSDate(res.completion_date)
            res.connection_date = ExcelDateToJSDate(res.connection_date)

            let dataToPush = []
            dataToPush.push(res.order_Id, res.provider, res.firstname, res.name, res.phone, res.mail, res.city, res.tzip, res.street, res.house_number, res.suffix, res.unit,res.area_Pop, res.order_status, res.project_Code, res.project_name, res.delivery_status, res.co_Id, res.order_Date, res.connection_date, res.completion_date);
            dataToPush.forEach((e,i) => {
                if(e == null || e == undefined || e == "NULL") {
                    dataToPush[i] = "";
                }
            })
            
            data.push(dataToPush)
        })
        }
        fs.unlink(fileTo, (err) => {
            if(err) reject(err)
        })
        //console.log(data)
        con.query("INSERT INTO korisnici (ORDERID, PROVIDER, FIRSTNAME, NAME, PHONE, EMAIL, CITY, TZIP, STREET, HAUSNUMMER, ZUSAT, EINHEIT, AREAPOP, STATUS, PROJECTCODE, PROJECTNAME, ARSTATUS, CO_ID, ORDERDATE, CONNECTIONDATE, COMPLETIONDATE) VALUES ?", [data], (err, results) => {
            if (err) reject(err)
            else {
                resolve(results);
            }
        })
    })
}

mydb.getRoles  = () => {
    return new Promise((resolve, reject) => {
        con.query("SELECT * FROM rolovi", (err, results) => {
            if(err) reject(err)
            resolve(results)
        });
    })
}

mydb.getColumns = () => {
    return new Promise((resolve, reject) => {
        con.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'korisnici' ORDER BY ORDINAL_POSITION", (err, results) => {
            if(err) reject(err)
            resolve(results)
        })
    })
}

mydb.updateRoles = (role, columns) => {
    return new Promise((resolve, reject) => {
        con.query("SELECT columns FROM rolovi WHERE role=?",role,(err,results) => {
            if(err) reject(err)
            con.query("UPDATE rolovi SET columns=? WHERE role=?",[columns, role], (err, results) => {
                resolve(results)
            })
        })
    })
}

module.exports = mydb;