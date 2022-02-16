#!/usr/bin/env node
const Service = require('../lib')
new Service.EntryService(process.argv).run()
