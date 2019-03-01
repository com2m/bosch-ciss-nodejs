#!/usr/bin/env node

import { BoschCiss } from './bosch-ciss';

const ciss = new BoschCiss('00:00:00:00:00:00');
ciss.subject.subscribe(console.log);
