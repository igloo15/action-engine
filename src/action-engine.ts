export type ActionService<T> = (
  context: T,
  elapsed: number,
  frame: number
) => void;

interface ActionItem<T> {
  name: string;
  interval: number;
  validRange: number;
  action: ActionService<T>;
}

export class ActionEngine<T> {
  private _normalActions: ActionItem<T>[] = [];
  private _preciseActions: ActionItem<T>[] = [];
  private _normalAnimationActions: ActionItem<T>[] = [];
  private _preciseAnimationActions: ActionItem<T>[] = [];
  private _context: T;
  private _interval: number;
  private _timerId: any;
  private _normalElapsed = 0;
  private _preciseElapsed = 0;
  private _frame = 0;
  private _start = performance.now();
  private _lastTime = performance.now();

  constructor(context: T, interval: number) {
    this._context = context;
    this._interval = interval;
  }

  addAction(
    action: ActionService<T>,
    interval: number = 1,
    name: string = "",
    range: number = 0
  ) {
    this.addInternalAction(action, interval, range, name, "normal");
  }

  addPreciseAction(
    action: ActionService<T>,
    interval?: number,
    range?: number,
    name?: string
  ) {
    this.addInternalAction(action, interval, range, name, "precise");
  }

  addAnimationAction(
    action: ActionService<T>,
    interval?: number,
    range?: number,
    name?: string
  ) {
    this.addInternalAction(action, interval, range, name, "preciseAnim");
  }

  addPreciseAnimationAction(
    action: ActionService<T>,
    interval?: number,
    range?: number,
    name?: string
  ) {
    this.addInternalAction(action, interval, range, name, "normalAnim");
  }

  private addInternalAction(
    action: ActionService<T>,
    interval: number,
    range: number,
    name: string,
    type: "precise" | "normal" | "preciseAnim" | "normalAnim"
  ) {
    this.validateInterval(name, interval);
    this.validateRange(name, range, interval, type.indexOf("precise") > 0);
    const item: ActionItem<T> = {
      name,
      interval,
      action,
      validRange: this.getCorrectedRange(range, interval),
    };
    switch (type) {
      case "precise":
        this._preciseActions.push(item);
        break;
      case "preciseAnim":
        this._preciseAnimationActions.push(item);
        break;
      case "normalAnim":
        this._normalAnimationActions.push(item);
        break;
      default:
        this._normalActions.push(item);
        break;
    }
  }

  start() {
    this._timerId = setInterval(() => {
      this._lastTime = performance.now();
      this._preciseElapsed = this._lastTime - this._start;
      this._normalElapsed += this._interval;

      for (const tempAction of this._normalActions) {
        if (this._normalElapsed % tempAction.interval === 0) {
          tempAction.action(this._context, this._normalElapsed, this._frame);
        }
      }

      for (const precAction of this._preciseActions) {
        if (
          this._preciseElapsed % precAction.interval <
          precAction.validRange
        ) {
          precAction.action(this._context, this._preciseElapsed, this._frame);
        }
      }

      requestAnimationFrame(() => {
        for (const tempAction of this._normalAnimationActions) {
          if (this._normalElapsed % tempAction.interval === 0) {
            tempAction.action(this._context, this._normalElapsed, this._frame);
          }
        }

        for (const precAction of this._preciseAnimationActions) {
          if (
            this._preciseElapsed % precAction.interval <
            precAction.validRange
          ) {
            precAction.action(this._context, this._preciseElapsed, this._frame);
          }
        }
      });
      this._frame++;
    }, this._interval);
  }

  stop() {
    clearInterval(this._timerId);
  }

  private getCorrectedRange(range: number, interval: number): number {
    const correctedRange = range ?? interval * 0.01;
    if (correctedRange > interval || correctedRange < 0) {
      return interval * 0.01;
    }
    return correctedRange;
  }

  private validateInterval(name: string, interval: number) {
    if (interval < 0) {
      console.error(
        `Interval for action ${name} is less than zero : ${interval}`
      );
    }

    if (interval < this._interval) {
      console.error(
        `Interval for action ${name} should not be less than engine global update frequency - Action Interval: ${interval} / Global Interval: ${this._interval}`
      );
    }
    const loopCount =
      this.leastCommonMultiple(this._interval, interval) / interval;

    if (loopCount > 50) {
      console.error(
        `Interval for action ${name} will take ${loopCount} loops to be called due to irregalur action interval vs global interval - Action Interval: ${interval} / Global Interval: ${this._interval}`
      );
    }
  }

  private validateRange(
    name: string,
    range: number,
    interval: number,
    preciseCheck: boolean
  ) {
    if (range < 0) {
      console.error(`Range for action ${name} is less than zero : ${range}`);
    }

    if (range > interval) {
      console.error(
        `Range for action ${name} is greater than interval - Action Interval: ${interval} / Action Range: ${range}`
      );
    }

    if (preciseCheck && range < 2 && range >= 0) {
      console.warn(
        `Range for precise action ${name} is too low and will often miss being called - Action Range: ${range}`
      );
    }
  }

  private leastCommonMultiple(num1: number, num2: number) {
    //Find the smallest and biggest number from both the numbers
    const gcd = this.greatestCommonMultiple(num1, num2);

    //then calculate the lcm
    return (num1 * num2) / gcd;
  }

  private greatestCommonMultiple(num1: number, num2: number) {
    while (num1 != num2) {
      //check if num1 > num2
      if (num1 > num2) {
        //Subtract num2 from num1
        num1 = num1 - num2;
      } else {
        //Subtract num1 from num2
        num2 = num2 - num1;
      }
    }

    return num2;
  }
}
