var express = require('express');
var cron = require('node-cron');
var router = express.Router();
var mysql = require('mysql2')

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

const con  = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

// var con = mysql.createConnection({
//     host: "iptmkmutnb.com",
//     user: "bbcommerce",
//     password: "BBCommerce2021",
//     database: "iptmkmutnb_bbcommerce"
//     // port: '2121'
// })

// Get a connection from the pool
con.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool: ' + err.stack);
      return;
    }
  
    // Use the connection for database operations
    console.log('Connected as id ' + connection.threadId);
  
    // Release the connection when done
    connection.release();
  });


//set init email
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'note707170719@gmail.com',
        pass: 'flfsfqrwxycktzov'
    }
});



router.get('/getProduct', function (req, res, next) {
    con.query('SELECT * FROM product', function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.get('/getProductByKeyword/:keyword', function (req, res, next) {
    console.log(req?.params)
    // console.log(res?.body)
    // like %' + " " + "%"
    var keyword = req?.params?.keyword
    var sql = "SELECT * FROM product "
    sql += "where itemname like '%" + keyword + "%'"
    console.log(sql)
    con.query(sql, function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        // console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.get('/getProductByType/:type/:keyword', function (req, res, next) {
    console.log(req?.params)
    // console.log(res?.body)
    // like %' + " " + "%"
    var type = req?.params?.type
    var keyword = req?.params?.keyword
    var sql = "SELECT * FROM product "
    sql += "where type like '%" + type + "%'"
    if (keyword != "noData") {
        sql += "and itemname like '%" + keyword + "%'"
    }
    console.log(sql)
    con.query(sql, function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        // console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.get('/getProductByGroupType/:groupType/:keyword', function (req, res, next) {
    console.log(req?.params)
    // console.log(res?.body)
    // like %' + " " + "%"
    var groupType = req?.params?.groupType
    var keyword = req?.params?.keyword
    var sql = "SELECT * FROM product LEFT JOIN typedb ON product.type = typedb.id "
    sql += "where typedb.group_type like '%" + groupType + "%'"
    if (keyword != "noData") {
        sql += "and product.itemname like '%" + keyword + "%'"
    }
    console.log(sql)
    con.query(sql, function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        // console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});


router.get('/getType', function (req, res, next) {
    con.query('SELECT * FROM typedb', function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        // console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});
router.get('/getTypeByName/:typeName', function (req, res, next) {
    var typeName = req?.params?.typeName
    console.log("SELECT * FROM typedb WHERE id = '" + typeName + "'")
    con.query("SELECT * FROM typedb WHERE id = '" + typeName + "'", function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        // console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.get('/getTypeByGroupType/:groupType', function (req, res, next) {
    var groupType = req?.params?.groupType
    con.query("SELECT * FROM typedb where group_type like '%" + groupType + "%'", function (err, rows, fields) {
        if (err) throw err
        res.send(rows);
        // console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.get('/getGroupType', function (req, res, next) {
    con.query('SELECT DISTINCT group_type FROM typedb', function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        // console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.get('/getProductHistory', function (req, res, next) {
    con.query('SELECT * FROM historydb order by day desc', function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});


router.get('/getTopProductSell', function (req, res, next) {

    var sql = "SELECT h.itemname,h.productValue,SUM(h.numberitem) AS total_quantity, SUM(h.numberitem) * h.productValue  AS total_price FROM `historydb` h"
    sql += " INNER JOIN product p on h.itemname = p.itemname"
    sql += " WHERE h.day > DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND h.up_date = 'Delete' "
    sql += " GROUP by h.itemname,h.type ORDER BY h.numberitem DESC ; "
    console.log(sql)
    con.query(sql, function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        console.log('The solution is: ', rows)
    })

    // res.send('sdfddsf');
});

router.get('/getMonthlyProductSell', function (req, res, next) {

    var sql = "SELECT hd1.month,SUM(hd1.total_price) AS total_price FROM "
    sql += " (SELECT SUM(h.numberitem) * h.productValue AS total_price ,MONTH(h.day) as month FROM `historydb` h "
    sql += " INNER JOIN product p on h.itemname = p.itemname WHERE h.day > DATE_SUB(CURDATE(), INTERVAL 6 MONTH) "
    sql += " AND h.up_date = 'Delete' GROUP BY h.itemname,h.type,MONTH(h.day) ORDER BY h.numberitem DESC ) hd1 "
    sql += " GROUP BY hd1.month "

    console.log(sql)
    con.query(sql, function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        console.log('The solution is: ', rows)
    })

    // res.send('sdfddsf');
});

router.get('/getProductSellByMonthYear/:monthYear', function (req, res, next) {
    var monthYear = req?.params?.monthYear + "-01"

    var sql = "SELECT hd1.date as date ,SUM(hd1.total_price) AS total_price FROM "
    sql += " ( SELECT SUM(h.numberitem) * h.productValue AS total_price ,DAY(h.day) as date FROM `historydb` h "
    sql += " INNER JOIN product p on h.itemname = p.itemname WHERE MONTH(h.day) = "
    sql += " MONTH ( '" + monthYear + "')"
    sql += " AND YEAR(h.day) =  "
    sql += " YEAR ( '" + monthYear + "')"
    sql += " AND h.up_date = 'Delete' GROUP BY h.itemname,h.type,DAY(h.day) "
    sql += " ORDER BY h.numberitem DESC ) hd1 GROUP BY hd1.date "

    console.log(sql)
    con.query(sql, function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        console.log('The solution is: ', rows)
    })

    // res.send('sdfddsf');
});

router.get('/getAllUserWithoutAdmin', function (req, res, next) {
    con.query("SELECT * FROM userdb where position <> 'admin' ;", function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.post('/checkUser', function (req, res, next) {
    var username = req.body?.username;
    var password = req.body?.password;

    con.query("SELECT * FROM userdb where user = '" + username + "' and password = '" + password + "'", function (err, rows, fields) {
        if (err) throw err
        res.send(rows);
        console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.post('/checkUserByUserName', function (req, res, next) {
    var username = req.body?.username;

    con.query("SELECT * FROM userdb where user = '" + username + "'", function (err, rows, fields) {
        if (err) throw err
        res.send(rows);
        console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});

router.post('/checkUserByEmail', function (req, res, next) {
    var email = req.body?.email;

    con.query("SELECT * FROM userdb where email = '" + email + "' ", function (err, rows, fields) {
        if (err) throw err
        res.send(rows);
        console.log('The solution is: ', rows)

        // sent Mail
        if (rows.length > 0) {
            var infoText = "<div>"
            var link = "http://localhost:3000/ResetPassword/" + rows[0].user
            infoText += "<h1> มีบางคนร้องขอให้ตั้งค่ารหัสผ่านใหม่สำหรับบัญชีต่อไปนี้ \n";
            infoText += "<h1> ชื่อผู้ใช้ " + rows[0].user + " </h1> \n";
            infoText += "<h1>" + link + "</h1> \n";


            var mailOptions = {
                from: 'note707170719@gmail.com',
                to: rows[0].email,
                subject: "เปลี่ยนรหัสผ่านใหม่",
                html: infoText
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }




    })
    // res.send('sdfddsf');
});

router.post('/saveNewPassword', function (req, res, next) {
    var userId = req.body?.userId;
    var password = req.body?.password;

    console.log(userId);
    console.log(password);

    var sql = "UPDATE `userdb` SET `password` = ";
    sql += "'" + password + "'"
    sql += " where `id` = "
    sql += "'" + userId + "'"
    console.log(sql);
    con.query(sql, function (err, result) {
        if (err) {
            console.log(err)
            response = 'error';
        } else {
            console.log("Edit 1 row in userdb ");
        }
    });
    res.send("success");



})

router.post('/saveUser', function (req, res, next) {
    var data = req.body?.data;
    var isNewUser = req.body?.isNew;

    console.log(isNewUser);
    con.query("SELECT * FROM userdb where user = '" + data?.user + "' ", function (err, rows, fields) {
        if (err) throw err
        if (rows.length > 0) {
            if (isNewUser == false) {
                var sql = "UPDATE `userdb` SET `user` = ";
                sql += "'" + data?.user + "',"
                sql += "`password` = "
                sql += "'" + data?.password + "',"
                sql += "`position` = "
                sql += "'" + data?.position + "',"
                sql += "`email` = "
                sql += "'" + data?.email + "',"
                sql += "`phone` = "
                sql += "'" + data?.phone + "',"
                sql += "`user_firstname` = "
                sql += "'" + data?.user_firstname + "',"
                sql += "`user_surname` = "
                sql += "'" + data?.user_surname + "'"
                sql += " where `id` = "
                sql += "'" + data?.id + "'"
                console.log(sql);
                con.query(sql, function (err, result) {
                    if (err) {
                        console.log(err)
                        response = 'error';
                    } else {
                        console.log("Edit 1 row in userdb ");
                    }
                });
                res.send("success");
            } else {
                res.send("duplicate");
            }
        } else {
            var sql = "INSERT INTO `userdb` ( `user`, `password`, `position`, `email`, `phone`, `user_firstname`, `user_surname`) VALUES (";
            sql += "'" + data?.user + "',"
            sql += "'" + data?.password + "',"
            sql += "'" + data?.position + "',"
            sql += "'" + data?.email + "',"
            sql += "'" + data?.phone + "',"
            sql += "'" + data?.user_firstname + "',"
            sql += "'" + data?.user_surname + "'"
            sql += ")"
            console.log(sql);
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err)
                    response = 'error';
                } else {
                    console.log("add 1 row in userdb ");
                }
            });
            res.send("success");
        }
    })
})

router.post('/saveProduct', function (req, res, next) {
    var data = req.body?.productData;
    var imageUrl = req.body?.imageUrl;

    con.query("SELECT * FROM product where itemname = '" + data?.productName + "' and type = '" + data?.productType + "'", function (err, rows, fields) {
        if (err) throw err
        if (rows.length > 0) {
            res.send("duplicate");
        }
        else {
            console.log(data);
            var sql = "INSERT INTO `product` ( `itemname`, `setitem`, `day`, `detail`, `img`, `type`, `countProduct`, `productValue`) VALUES (";
            sql += "'" + data?.productName + "',"
            sql += "'" + data?.productGroupType + "',"
            sql += "'" + data?.date + "',"
            sql += "'" + data?.note + "',"
            sql += "'" + imageUrl + "',"
            sql += "'" + data?.productType + "',"
            sql += "'" + data?.productCount + "',"
            sql += "'" + data?.productValue + "'"
            sql += ")"
            console.log(sql);
            con.query(sql, function (err, result) {
                if (err) {
                    console.log(err)
                    response = 'error';
                } else {
                    console.log("add 1 row in product ");
                }
            });
            res.send("success");
        }
    })
})
router.post('/updateProduct', function (req, res, next) {
    var data = req.body?.productData;
    console.log(data);
    var sql = "UPDATE `product` SET `countProduct` = ";
    sql += "'" + data?.productCount + "',"
    sql += "`detail` = "
    sql += "'" + data?.note + "',"
    sql += "`update_ts` = "
    sql += "'" + data?.updateTs + "'"
    sql += " where `product`.`itemname` = "
    sql += "'" + data?.productName + "'"
    sql += " and `product`.`type` = "
    sql += "'" + data?.productType + "'"
    console.log(sql);
    con.query(sql, function (err, result) {
        if (err) {
            console.log(err)
            response = 'error';
        } else {
            console.log("update product ");
        }
    });
    res.send("success");
})

router.post('/removeUserById', function (req, res, next) {
    var id = req.body?.id;
    console.log(id);
    var sql = "DELETE FROM `userdb` where id = '";
    sql += id + "'"
    console.log(sql);
    con.query(sql, function (err, result) {
        if (err) {
            console.log(err)
        } else {
            console.log("remove 1 row in product ");
        }
    });
    res.send('success');
})

router.post('/deleteProduct', function (req, res, next) {
    var id = req.body?.id;
    console.log(id);
    var sql = "DELETE FROM `product` where id = '";
    sql += id + "'"
    console.log(sql);
    con.query(sql, function (err, result) {
        if (err) {
            console.log(err)
        } else {
            console.log("remove 1 row in product ");
        }
    });
    res.send('success');
})

router.post('/saveProductHistory', function (req, res, next) {

    var data = req.body?.productData;

    console.log(data);
    var sql = "INSERT INTO `historydb` ( `itemname`, `day`, `detail`, `up_date`, `type`, `numberitem`, `productValue`) VALUES (";
    sql += "'" + data?.productName + "',"
    sql += "'" + data?.date + "',"
    sql += "'" + data?.note + "',"
    sql += "'" + req.body?.status + "',"
    sql += "'" + data?.productType + "',"
    sql += "'" + data?.productCount + "',"
    sql += "'" + data?.productValue + "'"
    sql += ")"
    console.log(sql);
    con.query(sql, function (err, result) {
        if (err) {
            console.log(err)
        } else {
            console.log("add 1 row in product history ");
        }
    });

    res.send('success');
})


router.post('/saveContactData', function (req, res, next) {

    var data = req.body?.contactData;
    var isCreatedByAdmin = req.body?.isAdmin;

    console.log(isCreatedByAdmin)

    console.log(data);
    var today = (new Date()).toISOString().slice(0, 19).replace('T', ' ');
    var sql = "INSERT INTO `contact` ( `name_surname`, `phone_contact`, `Email_contact`, `detail_contact`, `createdByAdmin`, `create_ts`) VALUES (";
    sql += "'" + data?.fullName + "',"
    sql += "'" + data?.phone + "',"
    sql += "'" + data?.email + "',"
    sql += "'" + data?.detailContact + "',"
    sql += "" + isCreatedByAdmin + ","
    sql += "'" + today + "'"
    sql += ")"
    console.log(sql);
    con.query(sql, function (err, result) {
        if (err) {
            console.log(err)
        } else {
            console.log("add 1 row in Contact Data ");
        }
    });

    res.send('success');
})



router.post('/sendNotificationEmail', function (req, res, next) {
    var data = req.body?.productData;
    if (data?.productCount < 5) {

        con.query("SELECT * FROM userdb ", function (err, rows, fields) {
            if (err) throw err
            for (var i = 0; i < rows.length; i++) {
                var mailOptions = {
                    from: 'note707170719@gmail.com',
                    to: rows[i].email,
                    subject: data?.productName + " " + "ใกล้จะหมดแล้ว",
                    text: 'จำนวนที่เหลือ : ' + data?.productCount + " " + "ชิ้น"
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        })
    }
    res.send("success")
})

router.get('/sendNotificationProductFreez', function (req, res, next) {

    con.query("SELECT * from historydb WHERE itemname not in (SELECT m.itemname FROM historydb m WHERE day > DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP by itemname,type)", function (err, rows, fields) {
        if (err) throw err
        var productData = rows
        con.query("SELECT * FROM userdb ", function (err, rows, fields) {
            if (err) throw err
            for (var i = 0; i < rows.length; i++) {
                var infoText = ""
                for (var j = 0; j < productData.length; j++) {
                    infoText += productData[j].itemname
                    infoText += "\n"
                }
                console.log(infoText)
                var mailOptions = {
                    from: 'note707170719@gmail.com',
                    to: rows[i].email,
                    subject: "สินค้าไม่เคลื่อนไหวเกิน 30 วัน",
                    text: infoText
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        })
    })



    res.send("success")
})

router.get('/getAllContact/:limit/:offset/:isAdminData', function (req, res, next) {
    var data = req?.params;
    var query = "select * from `contact` where createdByAdmin = " + data?.isAdminData + " order by id desc limit " + data?.limit + " offset " + data?.offset;
    con.query(query, function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});


router.get('/getProductByFilter/:keyword/:productGroup/:product/:limit/:offset', function (req, res, next) {
    console.log(req?.params)
    // console.log(res?.body)
    // like %' + " " + "%"
    var data = req?.params;

    var sql = "SELECT product.* FROM product LEFT JOIN typedb ON product.type = typedb.id where 1=1 "

    // keyword
    if (data?.keyword != "null" && data?.keyword != "" && data?.keyword != "undefined") {
        sql += " and product.itemname like '%" + data?.keyword + "%'"
    }

    // productGroup
    if (data?.productGroup != "null" && data?.productGroup != "" && data?.productGroup != "undefined") {
        sql += " and typedb.group_type like '%" + data?.productGroup + "%'"
    }

    // type
    if (data?.product != "null" && data?.product != "" && data?.product != "undefined") {
        sql += " and typedb.type like '%" + data?.product + "%'"
    }

    sql += " limit " + data?.limit + " offset " + data?.offset

    console.log(sql)
    con.query(sql, function (err, rows, fields) {
        if (err) throw err

        res.send(rows);
        // console.log('The solution is: ', rows)
    })
    // res.send('sdfddsf');
});


router.get('/abc', function (req, res, next) {
    res.send('abc');
})


// async function buildString() {
//     try {
//       const connection = await DatabasePool.getConnection();
//       con.query("SELECT * from product WHERE itemname not in (SELECT m.itemname FROM historydb m WHERE day > DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP by itemname,type)", function (err, rows, fields) {
//           if (err) throw err
//           var productFreezData = rows
//       })
//       const string2 = await connection.query(query);
//       const string3 = await connection.query(query);
//       const string4 = await connection.query(query);

//       return string1 + string2 + string3 + string4;
//     } catch (err) {
//       // do something
//     }
//   }
// schedule
cron.schedule('*/1 * * * *', function () {

    var productFreezData = []
    var productLessData = []


    // สินค้าไม่เคลื่อนไหว
    con.query("SELECT * from product WHERE itemname not in (SELECT m.itemname FROM historydb m WHERE day > DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP by itemname,type)", function (err, rows, fields) {
        if (err) throw err
        productFreezData = rows
    })

    // สินค้าเหลือน้อยกว่า 10 ชิ้น
    con.query("SELECT * from product WHERE setitem < 10", function (err, rows, fields) {
        if (err) throw err
        productLessData = rows
    })

    // sent Mail
    con.query("SELECT * FROM userdb ", function (err, rows, fields) {
        if (err) throw err
        for (var i = 0; i < rows.length; i++) {
            var infoText = "<html><head><meta http-equiv='Content-Language' content='th'/><meta http-equiv='Content-Type' content='text/html; charset=utf-8'/></head><body><div>";
        
            // ไม่เคลื่อนไหว 30 วัน
            infoText += "<h1> รายการสินค้าไม่เคลื่อนไหวภายใน 30 วัน " + productFreezData.length + " รายการ </h1>\n";
            for (var j = 0; j < productFreezData.length; j++) {
                console.log(productFreezData[j])
                infoText += "<p> " + (j + 1) + ". " + productFreezData[j].itemname + "</p>\n";
            }
        
            // สินค้าเหลือน้อยกว่า 10 ชิ้น
            infoText += "<h1> รายการสินค้าสินค้าเหลือน้อยกว่า 10 ชิ้น " + productLessData.length + " รายการ  </h1>\n";
            for (var j = 0; j < productLessData.length; j++) {
                infoText += "<p> " + (j + 1) + ". " + productLessData[j].itemname + "</p>\n";
            }
        
            infoText += "</div></body></html>";
            console.log(infoText)
            var mailOptions = {
                from: 'note707170719@gmail.com',
                to: rows[i].email,
                subject: "สินค้าไม่เคลื่อนไหวเกิน 30 วัน",
                html: infoText,
            };
        
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    })

});




module.exports = router;