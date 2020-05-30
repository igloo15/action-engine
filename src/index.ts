//export * from "./action-engine";

import "./style.scss";
import { ActionEngine } from './action-engine';

console.log("Hello World");

const actionEngine = new ActionEngine(23, 1000);

actionEngine.addAnimationAction((context, elapsed, frame) => {
    console.log(`Normal Action - Context: ${context}, Elapsed: ${elapsed}, Frame: ${frame}`);
}, 2000);

actionEngine.addPreciseAction((context, elapsed, frame) => {
    console.log(`Precision Action - Context: ${context}, Elapsed: ${elapsed}, Frame: ${frame}`);
}, 3000, 1);

actionEngine.start();
