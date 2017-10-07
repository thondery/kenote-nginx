
module.exports = (opts) => [
  {
    type: 'input',
    name: 'name',
    message: 'name:',
    default: 'default',
    validate: validName.bind(this, opts.confs)
  },
  {
    type: 'input',
    name: 'serverPort',
    message: 'serverPort:',
    default: 4000,
    validate: validPort
  },
  {
    type: 'input',
    name: 'serverName',
    message: 'serverName:',
    default: '0.0.0.0'
  },
  {
    type: 'input',
    name: 'rootPath',
    message: 'rootPath:',
    default: '/usr/share/nginx/html'
  },
]

const validName = (confs, value) => {
  if (confs.indexOf(`${value}.conf`) === -1) {
    return true
  }
  return 'name already exists'
}

const validPort = value => {
  if (/\d/.test(value)) {
    return true
  }
  return 'port must be a number'
}