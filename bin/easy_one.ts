#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MeraparLowHangingFruitStack } from '../lib/easy_one-stack';

const app = new cdk.App();
new MeraparLowHangingFruitStack(app, 'MeraparLowHangingFruitStack', {
});