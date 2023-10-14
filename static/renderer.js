const loginElement = document.getElementById('login');
const dashboard = document.getElementById('dashboard');
const storage = document.getElementById('storage');

let fetcher = null;
let actualStorage = 0;

class Fetcher {
  constructor(token) {
    this.token = token;
    //this.endpoint = 'https://saga-storage.onrender.com';
    this.endpoint = 'http://localhost:3030';
  }
  async _fetch(path, method = 'GET', data = {}) {
    const res = await  fetch(`${this.endpoint}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      ...data
    });

    return res.json();
  }
  getDevices() {
    return this._fetch('/device', 'GET');
  }

  async getStorage() {
    const {storageSize} = await this._fetch('/storage', 'GET');

    return storageSize;
  }
}

function toggleLogin(isLogged) {
  if (isLogged) {
    loginElement.style.display = 'none';
    dashboard.style.display = 'flex';
  } else {
    loginElement.style.display = 'flex';
    dashboard.style.display = 'none';
  }
}

function updateStorage(size) {
  actualStorage += size;

  const measurement = ['B', 'Kb', 'Mb', 'Gb', 'Tb'];
    
  let finalSize = actualStorage;
  let i = 0;

  while(finalSize >= 1024) {
    finalSize = finalSize / 1024;
    i++;
  }
    
  storage.innerText = `${finalSize.toFixed(1)}${measurement[i]}`
}

async function login() {
  const email = document.getElementById('email');
  const password = document.getElementById('password');

  const token = await utils.login(email.value, password.value);

  if (!token) //Add message on UI
    return alert('Credenciales invalidas');


  fetcher = new Fetcher(token);
  
  const storageSize = await fetcher.getStorage();
  
  updateStorage(storageSize);
  toggleLogin(true);

  utils.onUpdateStorage((e, size) => updateStorage(size));

}

async function init() {
  const token = await utils.isLogged();

  if (!token)
    return;
  
  fetcher = new Fetcher(token);
  
  const storageSize = await fetcher.getStorage();
  updateStorage(storageSize);  
  
  toggleLogin(true);

  utils.onUpdateStorage((e, size) => updateStorage(size));
}

init();
