import * as Statements from "../statements";
import * as Expressions from "../expressions";
import {Scope} from "./scope";
import {StatementNode} from "../nodes";
import {TypedIdentifier} from "./_typed_identifier";

export class ClassAttribute extends TypedIdentifier {
  private scope: Scope;
  private type: string | undefined;
//  private readOnly: boolean;

  constructor(node: StatementNode, scope: Scope) {
    if (!(node.get() instanceof Statements.Data)
        && !(node.get() instanceof Statements.DataBegin)
        && !(node.get() instanceof Statements.ClassData)
        && !(node.get() instanceof Statements.ClassDataBegin)) {
      throw new Error("ClassAttribute, unexpected node, 1");
    }
    const found = node.findFirstExpression(Expressions.NamespaceSimpleName);
    if (found === undefined) {
      throw new Error("ClassAttribute, unexpected node, 2");
    }
    const token = found.getFirstToken();

    super(token, node);
    this.scope = scope;
//    this.readOnly = undefined;

    const foundType = node.findFirstExpression(Expressions.Type);
    if (foundType) {
      if ((foundType.getChildren()[1].getFirstToken().getStr() === "REF") &&
          (foundType.getChildren()[1].getFirstToken().getStr() === "TO")) {
        this.type = foundType.findFirstExpression(Expressions.FieldChain)!.findFirstExpression(Expressions.Field)!.getFirstToken().getStr();
      }
    }
  }

  public getScope() {
    return this.scope;
  }

  public getType() {
    return this.type;
  }
/*
  public isReadOnly() {
    return this.readOnly;
  }
*/

}