const express = require('express');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const path = require('path');


const app = express();
const port = process.env.PORT || 3000;

const accessLogStream = rfs.createStream('access.log', {
	interval: '1d', // rotate daily
	path: path.join(__dirname, 'logs/access'),
});

const errorLogStream = rfs.createStream('error.log', {
	interval: '1d', // rotate daily
	path: path.join(__dirname, 'logs/error'),
});

morgan.token('error', (req, res) => `${req.error.message} - ${req.error.stack}`);

const getCustomErrorMorganFormat = () => JSON.stringify({
	method: ':method',
	url: ':url',
	http_version: ':http-version',
	response_time: ':response-time',
	status: ':status',
	content_length: ':res[content-length]',
	timestamp: ':date[iso]',
	headers_count: 'req-headers-length',
	error: ':error',
});

app.use(morgan(getCustomErrorMorganFormat(), {
	skip: (req, res) => (res.statusCode < 400),
	stream: errorLogStream,
}));

app.use(morgan('combined', {
	stream: accessLogStream,
}));

app.get('/', (req, res) => {
	res.json('hello');
});

app.get('/error', (req, res) => {
	try {
		const a = 1;
		a = 2;
		res.json(a);
	} catch (error) {
		req.error = error;
		res.status(500).json('internal server error');
	}
});

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`);
});
