#!/usr/bin/env node

import { scan } from './scanner';
import { printReport } from './report';

const cwd = process.cwd();
const { sites, filesScanned, timeMs } = scan(cwd);
printReport(sites, filesScanned, timeMs, cwd);
