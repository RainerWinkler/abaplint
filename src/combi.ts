import "../typings/index.d.ts";
import * as Tokens from "./tokens/";

export class Result {
  private tokens: Array<Tokens.Token>;

  constructor(a: Array<Tokens.Token>) {
    this.tokens = a;
  }

  public peek(): Tokens.Token {
    return this.tokens[0];
  }

  public shift(): Result {
    let copy = this.tokens.slice();
    copy.shift();
    return new Result(copy);
  }

  public length(): number {
    return this.tokens.length;
  }

  public toStr(): string {
    let ret = "";
    for (let token of this.tokens) {
      ret = ret + " " + token.getStr();
    }
    return ret;
  }
}

export interface IRunnable {
  run(r: Array<Result>): Array<Result>;
  railroad(): string;
  toStr(): string;
}

class Regex implements IRunnable {

  private regexp: RegExp;

  constructor(r: RegExp) {
    this.regexp = r;
  }

  public run(r: Array<Result>): Array<Result> {
    let result: Array<Result> = [];

    for (let input of r) {
      if (input.length() !== 0
          && this.regexp.test(input.peek().getStr()) === true) {
        result.push(input.shift());
      }
    }

    return result;
  }

  public railroad() {
    return "Railroad.Terminal(\"" + this.regexp.source.replace(/\\/g, "\\\\") + "\")";
  }

  public toStr() {
    return this.regexp.toString();
  }
}

class Word implements IRunnable {

  private s: String;

  constructor(s: String) {
    this.s = s;
  }

  public run(r: Array<Result>): Array<Result> {
    let result: Array<Result> = [];

    for (let input of r) {
      if (input.length() !== 0
          && input.peek().getStr().toUpperCase() === this.s.toUpperCase()) {
//        console.log("match, " + this.s.toUpperCase());
        result.push(input.shift());
      }
    }
    return result;
  }

  public railroad() {
    return "Railroad.Terminal('\"" + this.s + "\"')";
  }

  public toStr() {
    return "\"" + this.s + "\"";
  }
}

class Optional implements IRunnable {

  private opt: IRunnable;

  constructor(opt: IRunnable) {
    this.opt = opt;
  }

  public run(r: Array<Result>): Array<Result> {
    let result: Array<Result> = [];

    for (let input of r) {
      result.push(input);
      let res = this.opt.run([input]);
      result = result.concat(res);
    }

    return result;
  }

  public railroad() {
    return "Railroad.Optional(" + this.opt.railroad() + ")";
  }

  public toStr() {
    return "opt(" + this.opt.toStr() + ")";
  }
}
/*
function outputResultArray(r: Array<Result>) {
  let cnt = 1;
  for (let input of r) {
    console.log(cnt + "\t" + input.toStr());
    cnt++;
  }
}
*/
class Star implements IRunnable {

  private star: IRunnable;

  constructor(star: IRunnable) {
    this.star = star;
  }

  public run(r: Array<Result>): Array<Result> {
    let result = r;

// console.log("Star input " + r.length + " " + this.star.toStr());
// outputResultArray(r);

    let res = r;
    let input: Array<Result> = [];
    while (true) {
      input = res;
      res = this.star.run(input);

      if (res.length === 0) {
        break;
      }
// console.log("\nStar add " + res.length);
// outputResultArray(res);
      result = result.concat(res);
    }
// console.log("\nStar return " + result.length);

// console.clear();
    return result;
  }

  public railroad() {
    return "Railroad.ZeroOrMore(" + this.star.railroad() + ")";
  }

  public toStr() {
    return "star(" + this.star.toStr() + ")";
  }
}

class Plus implements IRunnable {

  private plus: IRunnable;

  constructor(plus: IRunnable) {
    this.plus = plus;
  }

  public run(r: Array<Result>): Array<Result> {
    return new Sequence([this.plus, new Star(this.plus)]).run(r);
  }

  public railroad() {
    return "Railroad.OneOrMore(" + this.plus.railroad() + ")";
  }

  public toStr() {
    return "plus(" + this.plus.toStr() + ")";
  }

}

class Sequence implements IRunnable {
  private list: Array<IRunnable>;

  constructor(list: IRunnable[]) {
    if (list.length < 2) {
      throw new Error("Sequence, length error");
    }
    this.list = list;
  }

  public run(r: Array<Result>): Array<Result> {
    let result: Array<Result> = [];

    for (let input of r) {
      let temp = [input];
      for (let seq of this.list) {
        temp = seq.run(temp);
        if (temp.length === 0) {
          break;
        }
      }

      result = result.concat(temp);
    }

    return result;
  }

  public railroad() {
    let children = this.list.map((e) => { return e.railroad(); });
    return "Railroad.Sequence(" + children.join() + ")";
  }

  public toStr() {
    let ret = "";
    for (let i of this.list) {
      ret = ret + i.toStr() + ",";
    }
    return "seq(" + ret + ")";
  }
}

class WordSequence implements IRunnable {

  private str: String;

  constructor(str: String) {
    this.str = str;
  }

  public run(r: Array<Result>): Array<Result> {
    let foo = this.str.replace(/-/g, " - ");
    let split = foo.split(/[ ]/);

    let words: Array<IRunnable> = [];
    for (let str of split) {
      words.push(new Word(str));
    }

    return (new Sequence(words)).run(r);
  }

  public railroad() {
    return "Railroad.Terminal('\"" + this.str + "\"')";
  }

  public toStr() {
    return "str(" + this.str + ")";
  }
}

export class Reuse implements IRunnable {
  private runnable: () => IRunnable;
  private name: string;

  constructor(runnable: () => IRunnable, name: string) {
    this.runnable = runnable;
    this.name = name;
  }

  public run(r: Array<Result>): Array<Result> {
    return this.runnable().run(r);
  }

  public get_runnable(): IRunnable {
    return this.runnable();
  }

  public get_name(): string {
    return this.name;
  }

  public railroad() {
    return "Railroad.NonTerminal('" + this.name + "', 'reuse_" + this.name + ".svg')";
  }

  public toStr() {
    return "reuse(" + this.name + ")";
  }
}

class Permutation implements IRunnable {
  private list: Array<IRunnable>;

  constructor(list: IRunnable[]) {
    if (list.length < 2) {
      throw new Error("Permutation, length error");
    }
    this.list = list;
  }

  public run(r: Array<Result>): Array<Result> {
    let result: Array<Result> = r;

    for (let index = 0; index < this.list.length; index++) {
      let temp = this.list[index].run(r);
      if (temp.length !== 0) {
// match
        result = result.concat(temp);

        let left = this.list;
        left.splice(index, 1);
        if (left.length === 1) {
          result = result.concat(left[0].run(temp));
        } else {
          result = result.concat(new Permutation(left).run(temp));
        }
      }
    }

    return result;
  }

  public railroad() {
    let children = this.list.map((e) => { return e.railroad(); });
    return "Railroad.MultipleChoice(0, 'any'," + children.join() + ")";
  }

  public toStr() {
    let children = this.list.map((e) => { return e.toStr(); });
    return "per(" + children.join() + ")";
  }
}

class Alternative implements IRunnable {
  private list: Array<IRunnable>;

  constructor(list: IRunnable[]) {
    if (list.length < 2) {
      throw new Error("Alternative, length error");
    }
    this.list = list;
  }

  public run(r: Array<Result>): Array<Result> {
    let result: Array<Result> = [];

    for (let input of r) {
      for (let seq of this.list) {
        let temp = seq.run([input]);
        result = result.concat(temp);
      }
    }

    return result;
  }

  public railroad() {
    let children = this.list.map((e) => { return e.railroad(); });
    return "Railroad.Choice(0, " + children.join() + ")";
  }

  public toStr() {
    let ret = "";
    for (let i of this.list) {
      ret = ret + i.toStr() + ",";
    }
    return "alt(" + ret + ")";
  }
}

export class Combi {

  public static railroad(runnable: IRunnable, complex = false): string {
    let type = "Railroad.Diagram(";
    if (complex === true) {
      type = "Railroad.ComplexDiagram(";
    }

    let result = type + runnable.railroad() + ").toString();";
    return result;
  }

  public static run(runnable: IRunnable, tokens: Array<Tokens.Token>, remove = false): boolean {
    let copy = tokens.slice();
    if (remove === true) {
      copy.pop();
    }

    copy = copy.filter(function (value) { return !(value instanceof Tokens.Pragma); } );

    let input = new Result(copy);

// console.dir(input);
    let result = runnable.run([input]);
//    console.log("results " + result.length);
    let success = false;
    for (let res of result) {
      if (res.length() === 0) {
        success = true;
        break;
      }
    }

    return success;
  }
}

export function str(s: string): IRunnable {
  if (/[ -]/.test(s) === false) {
    return new Word(s);
  } else {
    return new WordSequence(s);
  }
}
export function seq(first: IRunnable, ...rest: IRunnable[]): IRunnable {
  return new Sequence([first].concat(rest));
}
export function alt(first: IRunnable, ...rest: IRunnable[]): IRunnable {
  return new Alternative([first].concat(rest));
}
export function per(first: IRunnable, ...rest: IRunnable[]): IRunnable {
  return new Permutation([first].concat(rest));
}
export function opt(first: IRunnable): IRunnable {
  return new Optional(first);
}
export function star(first: IRunnable): IRunnable {
  return new Star(first);
}
export function regex(r: RegExp): IRunnable {
  return new Regex(r);
}
export function plus(first: IRunnable): IRunnable {
  return new Plus(first);
}
export function reuse(run: () => IRunnable, name: string): Reuse {
  return new Reuse(run, name);
}