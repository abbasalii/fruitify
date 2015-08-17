var PORT = process.env.PORT;
// var PORT = 8080;

var mysql 	= require('mysql');
var express = require('express');
var fs 		= require('fs');
var url 	= require('url');
var pool 	=    mysql.createPool({
    connectionLimit : 4, //important
    host     : '207.46.136.162',
    port 	 : 3306,
    user     : 'b074863ba4f1e5',
    password : 'c4306926',
    database : 'Fruitify',
    debug    :  false
});


var app = express();

app.get('/new',function(req,res){

	var id = req.query.id;
	var name = req.query.name;

	pool.getConnection(function(err,connection){

		if (err) {
			// console.log("Failed to connect to the database");
			res.status(503);
			res.end();
			return;
		}

		connection.query('SELECT SCORE FROM user WHERE ID=?', [id],
			function(err,rows,fields) {
				if(err){
					// console.log("Failed to fetch previous score");
					connection.release();
					res.status(503);
					res.end();
				}
				else if(rows.length==0){

					// console.log("no previous record exists");
					connection.query('INSERT INTO user (ID, NAME) VALUES(?,?)', [id,name],

						function(err, rows, fields) {
							if (err){
								// console.log("Failed to create new user");
								res.status(503);
								res.end();
							}
							else{
								// console.log("User created with ID: "+id);
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
			res.status(503);
			res.end();
        });
	});
});

app.get('/update',function(req,res){

	var id = req.query.id;
	var score = req.query.score;
	var date = new Date();

	pool.getConnection(function(err,connection){

		if (err) {
			// console.log("Failed to connect to the database");
			res.status(503);
			res.end();
			return;
		}

		var getHighscore = function(){

			var result = {};
			connection.query('SELECT NAME, SCORE FROM USER WHERE SCORE IS NOT NULL ORDER BY SCORE DESC, DATEE LIMIT 10',
				function(err,rows,fields) {
					if(err){
						// console.log("Failed to fetch top 10 scores");
						connection.release();
						res.status(503);
						res.end();
					}
					else{
						// console.log("Fetched top ten results successfully");
						result['users'] = rows;
						var query = 'SELECT SCORE FROM USER WHERE SCORE>? OR (SCORE=? AND DATEE<?)';
						var values = [score,score,date];

						connection.query(query,values,
							function(err,rows,fields) {
								if(err) {
									// console.log("Failed to calculate rank");
									res.status(503);
									res.end();
								}
								else {
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
					res.status(503);
					res.end();
				}
				else{
					if(rows.length==0) {
						connection.release();
						res.status(503);
						res.end();
					}
					else if(score>rows[0].SCORE) {

						// console.log("New high score");
						connection.query('UPDATE USER SET SCORE=?, DATEE=? WHERE ID=?', [score,date,id],

							function(err, rows, fields) {
								if (err){
									connection.release();
									res.status(503);
									res.end();
									// console.log("Failed to update score");
								}
								else{
									// console.log("Score updated for user ID: "+id);
									getHighscore();
								}
							}
						);
					}
					else{
						// console.log("No new high score");
						getHighscore();
					}
				}
			}
		);

		connection.on('error', function(err) {
			// console.log("Error occurred while performing database operation");
			res.status(503);
			res.end();
        });
	});
});

app.listen(PORT,function(){
	// console.log("Listening at " + PORT);
});