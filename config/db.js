
var mysql = require('mysql')
var connection = mysql.createConnection({
    host: 'http://www.iptmkmutnb.com/phpMyAdmin/index.php',
    user: ' iptmkmutnb_bbcommerce',
    password: 'BBCommerce2021',
    database: 'iptmkmutnb_bbcommerce'
})
connection.connect((err) => {
    if (err) { // กรณีเกิด error
        console.error('error connecting: ' + err.stack)
        return
    }
    console.log('connected as id ' + db.threadId)
})

exports.connection = function() {
    return connection;
};
