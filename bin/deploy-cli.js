#!/usr/bin/env node
const Service = require('../lib/entryService')
new (Service.default ? Service.default : Service)(process.argv).run()
