var PORT = process.env.PORT;

var mysql 	= require('mysql');
var express = require('express');
var fs 		= require('fs');
var url 	= require('url');
var pool 	=    mysql.createPool({
    connectionLimit : 100, //important
    host     : '85.10.205.173',
    port 	 : 3306,
    user     : 'codistan',
    password : 'lionking',
    database : 'fruitifydb',
    debug    :  false
});


var app = express();

app.get('/new',function(req,res){

	var id = req.query.id;
	var name = req.query.name;
	var email = req.query.email;

	// console.log("ID: "+id);
	// console.log("NAME: "+name);
	// console.log("EMAIL: "+email);

	pool.getConnection(function(err,connection){

		if (err) {
			// console.log("Failed to connect to the database");
			res.end("Failed to connect to the database");
			return;
		}

		connection.query('SELECT SCORE FROM USER WHERE ID=?', [id],
			function(err,rows,fields) {
				if(err){
					// console.log("Failed to fetch previous score");
					connection.release();
					res.end("Failed to fetch previous score");
				}
				else if(rows.length==0){

					console.log("no previous record exists");
					connection.query('INSERT INTO USER (ID, NAME, EMAIL) VALUES(?,?,?)', [id,name,email],

						function(err, rows, fields) {
							if (err){
								console.log("Failed to create new user");
							}
							else{
								console.log("User created with ID: "+id);
								res.end(JSON.stringify({SCORE:0}));
							}
							connection.release();
						}
					);
				}
				else{
					console.log("previous record exists");
					connection.release();
					res.end(JSON.stringify({SCORE:rows[0].SCORE}));
				}
			}

		);

		connection.on('error', function(err) {
			// console.log("Error occurred while performing database operation");
			res.end("Error occurred while performing database operation");
        });
	});
});

app.get('/update',function(req,res){

	var id = req.query.id;
	var score = req.query.score;

	// console.log("ID: "+id);
	// console.log("SCORE: "+score);

	pool.getConnection(function(err,connection){

		if (err) {
			// console.log("Failed to connect to the database");
			res.end("Failed to connect to the database");
			return;
		}

		var getHighscore = function(sc,da){

			var result = {};
			connection.query('SELECT NAME, SCORE FROM USER WHERE SCORE IS NOT NULL ORDER BY SCORE DESC, DATEE LIMIT 10',
				function(err,rows,fields) {
					if(err){
						console.log("Failed to fetch top 10 scores");
						connection.release();
					}
					else{
						console.log("Fetched top ten results successfully");
						result['users'] = rows;
						var query = 'SELECT SCORE FROM USER WHERE SCORE>? OR (SCORE=? AND DATEE<?)';
						var values = [sc,sc,da];

						connection.query(query,values,
							function(err,rows,fields) {
								if(err) {
									console.log("Failed to calculate rank");
								}
								else {
									console.log("Yo mayn B-)");
									result['rank'] = rows.length+1;
									res.end(JSON.stringify(result));
								}
								connection.release();
							}
						);
					}
				}

			);
		}

		connection.query('SELECT SCORE, DATEE FROM USER WHERE ID=?', [id],

			function(err, rows, fields) {
				if (err){
					connection.release();
					// console.log("Failed to get previous score");
					res.end("Failed to get previous score");
				}
				else{
					if(rows.length==0) {
						res.end("No record exist against this id");
						connection.release();
					}
					else if(score>rows[0].SCORE) {

						console.log("New high score");
						var date = new Date();
						connection.query('UPDATE USER SET SCORE=?, DATEE=NOW() WHERE ID=?', [score,id],

							function(err, rows, fields) {
								if (err){
									connection.release();
									console.log("Failed to update score");
								}
								else{
									console.log("Score updated for user ID: "+id);
									getHighscore(score,date);
								}
							}
						);
					}
					else{
						console.log("No new high score");
						getHighscore(rows[0].SCORE,rows[0].DATEE);
					}
				}
			}
		);

		connection.on('error', function(err) {
			// console.log("Error occurred while performing database operation");
			res.end("Error occurred while performing database operation");
        });
	});
});

app.listen(PORT,function(){
	console.log("Listening at " + PORT);
});