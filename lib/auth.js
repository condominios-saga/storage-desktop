const {exists, writeFile, mkdir, readFile} = require('fs');
const {authFilePath, configDir, serverHost} = require('./constants');
const {getPlatform} = require('./utils');
const axios = require('axios');

const existsAuthFile =  () =>  (new Promise(resolve => exists(authFilePath, resolve)));
const writeAuthFile = async content => {
  const existsFile = await existsAuthFile();

  if (!existsFile)
    await new Promise(resolve => mkdir(configDir, resolve));

  return new Promise((resolve, reject) => writeFile(authFilePath, content, (err, res) => err ? reject(err) : resolve(res)));
}

const getConfigData = async () => {
  const existsFile = await existsAuthFile();

  if (!existsFile)
    await writeAuthFile('{}');

  return new Promise((resolve, reject) => readFile(authFilePath, (err, res) => err ? reject(err) : resolve(JSON.parse(res))));
}

const updateAuthFile = async data => {
  const authFile = await getConfigData();

  const newData = {
    ...authFile,
    ...data
  };

  return writeAuthFile(JSON.stringify(newData));
}

const login = async (email, password) => {
  try {
    const {data} = await axios.post(`${serverHost}/login/device`, {
      email,
      password
    });

    const {token} = data;

    if (!token)
      return null;

    //const platform = getPlatform();

    //const deviceResponse = await axios.post(`${serverHost}/device`, {
    //  type: 'desktop',
    //  platform
    //}, {
    //  headers: {
    //    Authorization: `Bearer ${token}`
    //  }
    //});

    //const {id} = deviceResponse.data;

    //if (!id)
    //  return null;

    return {token};

  } catch(err) {
    return null;
  }
}

module.exports = exports = {
  login,
  existsAuthFile,
  writeAuthFile,
  getConfigData,
  updateAuthFile
}