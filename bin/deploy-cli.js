#!/usr/bin/env node
const Service = require('../es/entryService')
new (Service.default ? Service.default : Service)(process.argv).run()
