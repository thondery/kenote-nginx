const program = require('commander')
const _ = require('lodash')
const pkg = require('./package.json')
const { conf, add, list, show } = require('./src')
const version = pkg.version


program
  .version(version)

program
  .name('node-nginx')
  .usage('[command] [options]')

program
  .command('conf [path]')
  .description('set nginx conf path...')
  .action( dir => conf(dir) )

program
  .command('add')
  .description('add nginx conf')
  .action( () => add() )
  
program
  .command('list')
  .description('list nginx confs')
  .action( () => list() )
  
program
  .command('show')
  .description('show nginx conf path')
  .action( () => show() )


// Parse and fallback to help if no args
if (_.isEmpty(program.parse(process.argv).args) && process.argv.length === 2) {
  program.help()
}