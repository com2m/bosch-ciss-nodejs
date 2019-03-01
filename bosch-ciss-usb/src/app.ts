#!/usr/bin/env node

import { BoschCiss } from './bosch-ciss';

const boschCiss = new BoschCiss('tty.usbmodem000000');
boschCiss.subject.subscribe(console.log);
