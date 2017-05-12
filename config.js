exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://localhost/tessellatedSecurity';
exports.PORT = process.env.PORT || 8080;

exports.TEST_DATABASE_URL = (
	process.env.TEST_DATABASE_URL ||
	'mongodb://localhost/tessellatedSecurity');

exports.SECRET = (process.env.SECRET || 'secret');

exports.USER = process.env.USER;

exports.PASS = process.env.PASS;