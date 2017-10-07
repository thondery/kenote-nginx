
module.exports = (name) => [
  {
    type: 'input',
    name: 'log',
    message: 'log:',
    default: `/wwwlogs/${name}.log`
  },
]