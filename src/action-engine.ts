export type ActionService<T> = (context: T, elapsed: number, frame: number) => void;

interface ActionItem<T> {
  name: string;
  interval: number;
  validRange: number;
  action: ActionService<T>;
}

export class ActionEngine<T> {
  private _frameActions: ActionItem<T>[] = [];
  private _preciseActions: ActionItem<T>[] = [];
  private _frameAnimationActions: ActionItem<T>[] = [];
  private _preciseAnimationActions: ActionItem<T>[] = [];
  private _context: T;
  private _interval: number;
  private _timerId: any;
  private _preciseElapsed = 0;
  private _frame = 0;
  private _start = performance.now();
  private _lastTime = performance.now();

  constructor(context: T, interval: number = 1000) {
    this._context = context;
    this._interval = interval;
  }

  addActionEngine(actionEngine: ActionEngine<T>, name: string = '') {
    this.addAction((context: T, elapsed: number, frame: number) => {
      actionEngine.processFrame(elapsed, frame, context);
    }, 1, name);
  }

  addAction(action: ActionService<T>, interval: number = 1, name: string = '') {
    this.addInternalAction(action, interval, 1, name, 'normal');
  }

  addPreciseAction(action: ActionService<T>, interval: number = 1000, range: number = 10, name?: string) {
    this.addInternalAction(action, interval, range, name, 'precise');
  }

  addAnimationAction(action: ActionService<T>, interval: number = 1000, name?: string) {
    this.addInternalAction(action, interval, 1, name, 'normalAnim');
  }

  addPreciseAnimationAction(action: ActionService<T>, interval: number = 1000, range: number = 10, name?: string) {
    this.addInternalAction(action, interval, range, name, 'preciseAnim');
  }

  private addInternalAction(action: ActionService<T>, interval: number, range: number, name: string, type: 'precise' | 'normal' | 'preciseAnim' | 'normalAnim') {
    this.validateInterval(name, interval, type.indexOf('precise') > 0);
    this.validateRange(name, range, interval, type.indexOf('precise') > 0);
    const item: ActionItem<T> = {
      name,
      interval,
      action,
      validRange: this.getCorrectedRange(range, interval),
    };
    switch (type) {
      case 'precise':
        this._preciseActions.push(item);
        break;
      case 'preciseAnim':
        this._preciseAnimationActions.push(item);
        break;
      case 'normalAnim':
        this._frameAnimationActions.push(item);
        break;
      default:
        this._frameActions.push(item);
        break;
    }
  }

  start() {
    this._timerId = setInterval(() => {
      this.next();
    }, this._interval);
  }

  stop() {
    clearInterval(this._timerId);
  }

  next() {
    this._lastTime = performance.now();
    this._preciseElapsed = this._lastTime - this._start;
    this.processFrame(this._preciseElapsed, this._frame, this._context);
    this._frame++;
  }

  processFrame(elapsedTime: number, frame: number, context: T) {
    for (const tempAction of this._frameActions) {
      if (frame % tempAction.interval === 0) {
        tempAction.action(context, elapsedTime, frame);
      }
    }
    for (const precAction of this._preciseActions) {
      if (elapsedTime % precAction.interval < precAction.validRange) {
        precAction.action(context, elapsedTime, frame);
      }
    }
    if (this._frameAnimationActions.length > 0 || this._preciseAnimationActions.length > 0) {
      requestAnimationFrame(() => {
        for (const tempAction of this._frameAnimationActions) {
          if (frame % tempAction.interval === 0) {
            tempAction.action(
              context,
              elapsedTime,
              frame
            );
          }
        }

        for (const precAction of this._preciseAnimationActions) {
          if (elapsedTime % precAction.interval < precAction.validRange) {
            precAction.action(context, elapsedTime, frame);
          }
        }
      });
    }
  }

  private getCorrectedRange(range: number, interval: number): number {
    const correctedRange = range ?? interval * 0.01;
    if (correctedRange > interval || correctedRange < 0) {
      return interval * 0.01;
    }
    return correctedRange;
  }

  private validateInterval(name: string, interval: number, preciseCheck: boolean) {
    if (interval < 0) {
      console.error(`Interval for action ${name} is less than zero : ${interval}`);
    }

    if (preciseCheck && interval < this._interval) {
      console.error(`Interval for action ${name} should not be less than engine global update frequency - Action Interval: ${interval} / Global Interval: ${this._interval}`);
    }
    const checkInterval = preciseCheck ? this._interval : 1;
    const loopCount = this.leastCommonMultiple(checkInterval, interval) / interval;

    if (loopCount > 50) {
      console.error(`Interval for action ${name} will take ${loopCount} loops to be called due to irregalur action interval vs global interval - Action Interval: ${interval} / Global Interval: ${this._interval}`);
    }
  }

  private validateRange(name: string, range: number, interval: number, preciseCheck: boolean) {
    if (range < 0) {
      console.error(`Range for action ${name} is less than zero : ${range}`);
    }

    if (range > interval) {
      console.error(`Range for action ${name} is greater than interval - Action Interval: ${interval} / Action Range: ${range}`);
    }

    if (preciseCheck && range < 2 && range >= 0) {
      console.warn(`Range for precise action ${name} is too low and will often miss being called - Action Range: ${range}`);
    }
  }

  private leastCommonMultiple(num1: number, num2: number) {
    const gcd = this.greatestCommonMultiple(num1, num2);
    return (num1 * num2) / gcd;
  }

  private greatestCommonMultiple(num1: number, num2: number) {
    while (num1 != num2) {
      if (num1 > num2) {
        num1 = num1 - num2;
      } else {
        num2 = num2 - num1;
      }
    }
    return num2;
  }
}
