const fs = require('fs-extra')
const path = require('path')
const ini = require('ini')
const _ = require('lodash')
const inquirer = require('inquirer')
const { mounts } = require('kenote-mount')

const { 
  addQuestion,
  logQuestion,
  upstreamQuestion
} = mounts(path.resolve(__dirname, './questions'), 'question')
const rcpath = path.resolve(process.env.HOME || process.env.HOMEPATH, '.node_nginxrc')
!fs.existsSync(rcpath) && 
  fs.writeFileSync(rcpath, ini.stringify({ conf_path: './vhost' }, { whitespace: true }), { encoding: 'utf-8' })
const nginxrc = fs.readFileSync(rcpath, { encoding: 'utf-8' })

exports.conf = (conf_path) => {
  let config = {
    conf_path: conf_path
  }
  fs.writeFileSync(rcpath, ini.stringify(config, { whitespace: true }), { encoding: 'utf-8' })
  console.log(`set path success!!!`)
}

exports.add = () => {
  let { conf_path } = ini.parse(nginxrc)
  let _root = /^\.\//.test(conf_path) ? process.cwd() : ''
  let confs = getConfs(_root, conf_path)
  let options = null
  return inquirer.prompt(addQuestion({confs}))
    .then( answers => {
      options = answers
      return inquirer.prompt(logQuestion(options.name))
    })
    .then( answers => {
      options = Object.assign(options, answers)
      return inquirer.prompt(upstreamQuestion)
    })
    .then( answers => {
      options = Object.assign(options, answers)
      addConf(path.join(_root, conf_path, `${options.name}.conf`), options)
      console.log(`add nginx ${options.name}.conf success！`)
    })
}

exports.list = () => {
  let { conf_path } = ini.parse(nginxrc)
  let _root = /^\.\//.test(conf_path) ? process.cwd() : ''
  let confs = getConfs(_root, conf_path)
  console.log(confs)
}

exports.show = () => {
  let { conf_path } = ini.parse(nginxrc)
  console.log(conf_path)
}

const getConfs = (_root, conf_path) => {
  let files = fs.readdirSync(path.join(_root, conf_path))
  return _.remove(files, o => /\.conf$/.test(o))
}

const addConf = (dir, opts) => {
  let log_format = opts.log && opts.log.length > 0 ? getConfByLogFormat(opts.name) : ''
  let access_log = opts.log && opts.log.length > 0 ? getConfByLog(opts.name, opts.log) : ''
  let proxy_conf = opts.upstream && opts.upstream.length > 0 ? getConfByProxy(opts.name) : ''
  let upstream = opts.upstream && opts.upstream.length > 0 ? getConfByUpstream(opts.name, opts.upstream) : ''
  let data = ``
    + `${log_format}`
    + `${upstream}`
    + `server {\n`
    + `    listen      ${opts.serverPort};\n`
    + `    server_name ${opts.serverName};\n`
    + `    index       index.html index.htm default.html default.htm;\n`
    + `    root        ${opts.rootPath};\n`
    + `\n`
    + `${proxy_conf}`
    + `    location ~ .*\\.(gif|jpg|jpeg|png|bmp|swf)$\n`
    + `    {\n`
    + `        expires      30d;\n`
    + `    }\n`
    + `\n`
    + `    location ~ .*\\.(js|css)?$\n`
    + `    {\n`
    + `        expires      12h;\n`
    + `    }\n`
    + `\n`
    + `${access_log}`
    + `}\n`
  fs.writeFileSync(dir, data, { encoding: 'utf-8' })
}

const getConfByLogFormat = (name) => {
  let log_format = `log_format  ${name} '$remote_addr - $remote_user [$time_local] "$request" '\n`
    + `            '$status $body_bytes_sent "$http_referer" '\n`
    + `            '"$http_user_agent" $http_x_forwarded_for';\n\n`
  return log_format
}

const getConfByLog = (name, log) => {
  let access_log = `    access_log  ${log}  ${name};\n`
  return access_log
}

const getConfByProxy = (name) => {
  let proxy_conf = `    location / {\n`
    + `        proxy_pass http://${name}-upstream;\n`
		+ `        proxy_redirect off;\n`
		+ `        proxy_set_header X-Real-IP $remote_addr;\n`
		+ `        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n`
		+ `        proxy_set_header Host $http_host;\n`
		+ `        proxy_set_header X-NginX-Proxy ture;\n`
		+ `        proxy_http_version 1.1;\n`
		+ `        proxy_set_header Upgrade $http_upgrade;\n`
		+ `        proxy_set_header Connection "upgrade";\n`
    + `    }\n\n`
  return proxy_conf
}

const getConfByUpstream = (name, upstream) => {
  let upstreamArr = upstream.split(/\s+/)
  let upstreamServer = ``
  for (let e of upstreamArr) {
    upstreamServer += `    server	${e};\n`
  }
  let _upstream = `upstream ${name}-upstream\n`
    + `{\n`
    + `${upstreamServer}`
    + `}\n\n`
  return _upstream
}