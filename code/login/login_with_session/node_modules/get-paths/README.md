# get-paths

[![build status](https://img.shields.io/travis/niftylettuce/get-paths.svg)](https://travis-ci.org/niftylettuce/get-paths)
[![code coverage](https://img.shields.io/codecov/c/github/niftylettuce/get-paths.svg)](https://codecov.io/gh/niftylettuce/get-paths)
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg)](https://lass.js.org)
[![license](https://img.shields.io/github/license/niftylettuce/get-paths.svg)](LICENSE)

> Helper function to get an absolute path for a template engine view


## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Contributors](#contributors)
* [License](#license)


## Install

[npm][]:

```sh
npm install get-paths
```

[yarn][]:

```sh
yarn add get-paths
```


## Usage

```js
const getPaths = require('get-paths');

const paths = await getPaths('views', 'home', 'pug');
```


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **Nick Baugh** | <http://niftylettuce.com/> |


## License

[MIT](LICENSE) © [Nick Baugh](http://niftylettuce.com/)


## 

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/
