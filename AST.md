# AST

**Note:** This file is derived from my personal notes and is neither complete nor guaranteed to be correct. It's aim is to provide a quick start for other interested contributors.

Universal `Node` instances are used to form the AST through referencing a node's `parent`, `firstChild` and `lastChild`. A node's children are additionally composed as a doubly-linked list referencing their `nextSibling` and `previousSibling`.

## NodeKind

Actual `Node` instance data depends upon the value of their `kind` property, that is one of the enumeration values of `NodeKind` ([reference](./src/node.thin#L1)). Besides holding `flags` and literal values like `stringValue`, each `Node` exposes kind-specific functions for convenience and unobtrusive application of assertions.

Categories are referenced by enclosing their names in angle brackets in the following.

## General (neither statement nor expression)

### FILE

Container holding a source file's statements.

* **fileFirstStatement()**: `<STATEMENT>`

### GLOBAL

Container holding global variables, functions and classes pulled from source `FILE`s.

### EXTENDS

Optional child of `CLASS` holding a reference to the extended type. Not yet supported.

* **extendsType()**: `<EXPRESSION>` (usually a `NAME`)

### IMPLEMENTS

Optional child of `CLASS` holding references to one or more implemented types. Not yet supported.

* **implementsFirstType()**: `<EXPRESSION>` (usually a `NAME`)

### PARAMETERS

Optional child container of `CLASS` or `FUNCTION` holding one or more generic type `PARAMETER`s. Not yet supported.

* **parametersFirstParameter()**: `PARAMETER`

### PARAMETER

Child of `PARAMETERS` holding a reference to the respective generic type. Not yet supported.

* **parameterType()**: `<EXPRESSION>` (usually a `NAME`)

### VARIABLE

Variable declaration or definition that can also be a child of the compact `VARIABLES` statement.

* **variableType()**: `<EXPRESSION>` (usually a `NAME` or `EMPTY`)
* **variableValue()**: `<EXPRESSION>` (not present if uninitialized)

### DECORATORS

Optional child container of `FUNCTION` holding one or more `DECORATOR` definitions. Rudimentary support.

* **decoratorsFirstDecorator()**: `DECORATOR`

### DECORATOR

Child of `DECORATORS` holding the respective name and zero or more decorator arguments. Rudimentary support.

* **decoratorName()**: `<EXPRESSION>` (usually a `NAME`, subject to change)
* **decoratorFirstArgument()**: `<EXPRESSION>`

## Statements : `<STATEMENT>`

### BLOCK

Block statement that is also used as a direct child of `FUNCTION` as the function body.

* **blockFirstStatement()**: `<STATEMENT>`

### BREAK

Literal `break`.

### CLASS

Container for classes. Has flags.

* **classParameters()**: `PARAMETERS` (present only if there is at least one parameter)
* **classExtends()**: `EXTENDS` (present only if extending)
* **classImplements()**: `IMPLEMENTS` (present only if there is at least one implementation)
* **classFirstMember()**: `FUNCTION` | `VARIABLE`
* **classConstructor()**: `FUNCTION` flagged `NODE_FLAG_CONSTRUCTOR`

### CONSTANTS

Like `VARIABLES` but holding constants.

### CONSTANT

Like `VARIABLE` but for constants. TODO: Investigate why this is a statement while `VARIABLE` is not.

### CONTINUE

Literal `continue`.

### EMPTY

Supplement for an empty `BLOCK`. TODO: Investigate if actually necessary.

### ENUM

An enum with its name present in `stringValue`. Can have flags.

### EXPRESSION

An expression statement not to be confused with `<EXPRESSION>`. Does not resolve to a value. Holds, for example, a function call whose return value is void or ignored.

* **expressionValue()**: `<EXPRESSION>`

### FUNCTION

Function declaration or definition. Has flags.

* **functionFirstArgument()**: `<EXPRESSION>` (usually a `VARIABLE`)
* **functionFirstArgumentIgnoringThis()**: `<EXPRESSION>` (usually a `VARIABLE`)
* **functionArgumentCount()**: `int`
* **functionReturnType()**: `<EXPRESSION>` (usually a `NAME`)
* **functionBody()**: `BLOCK` (`null` if there is no body, i.e. if a declaration / import)

### IF

* **ifValue()**: `<EXPRESSION>`
* **ifTrue()**: `BLOCK`
* **ifFalse()**: `BLOCK`

### RETURN

* **returnValue()**: `<EXPRESSION>` (`null` if the function is void)

### UNSAFE

Literal `unsafe`? TODO: This seems to be unused / replaced by flagging `BLOCK` and `FUNCTION` with `NODE_FLAG_UNSAFE`.

### VARIABLE

Variable declaration with the variable's name in `stringValue`.

* **variableType()**: `<EXPRESSION>` (`null` if the type has been omitted)
* **variableValue()**: `<EXPRESSION>` (`null` if not initialized)

### WHILE

* **whileValue()**: `<EXPRESSION>`
* **whileBody()**: `BLOCK`

## Expressions : `<EXPRESSION>`

### ALIGN_OF

`alignof value` returning the alignment of a type. Not yet supported.

### BOOL

Literal `bool`.

### CALL

* **callValue()**: `<EXPRESSION>` (usually a `NAME`)
* **callFirstArgument()** `<EXPRESSION>`

### CAST

A cast of a value to another type.

* **castValue()**: `<EXPRESSION>`
* **castType()**: `<EXPRESSION>` (usually a `NAME`)

### DOT

A dot access wrapper as used when accessing static or instance members. The node itself references the accessed member. Can be imagined as `(dot.dotTarget()).dot`.

* **dotTarget()**: `<EXPRESSION>`

### HOOK

Cointainer of a ternary condition that behaves much like an `IF` statement with the exception that it resolves to a value and does not allow `BLOCK`s.

* **hookValue()**: `<EXPRESSION>`
* **hookTrue()**: `<EXPRESSION>`
* **hookFalse()**: `<EXPRESSION>`

### INDEX

Index access expression, i.e. as used on arrays.

* **indexTarget()**: `<EXPRESSION>`

### INT

Literal integer value present in `intValue`.

### NAME

Literal name present in `stringValue`.

### NEW

Instantiation behaving much like `CALL`.

* **newType()**: `<EXPRESSION>` (usually a `NAME`)
* **newFirstArgument()**: `<EXPRESSION>`

### NULL

Literal `null`.

### PARSE_ERROR

Produced by the parser when there are errors. TODO: Investigate why this occasionally slips through to the C output.

### SIZE_OF

`sizeof value` operator behaving like C's `sizeof(value)`. Partially supported.

### STRING

Literal string value present in `stringValue`.

### THIS

Literal `this`.

### TYPE

Links a special type to the AST. Exclusively used with `this`, one for each class. Not to be confused with `Type` in `resolvedType`.

## Unary expressions : `<EXPRESSION>` & `<UNARY_EXPRESSION>`

Container for unary expressions where `kind` specifies one of the following unary operations.

* **unaryValue()**: `<EXPRESSION>`

### ADDRESS_OF

`&value`

### COMPLEMENT

`~value`

### DEREFERENCE

`*value`

### NEGATIVE

`-value`

### NOT

`!value`

### POINTER_TYPE

Like `TYPE`, but referencing the underlying pointer type, i.e. of a `NAME`.

### POSITIVE

`+value`

### POSTFIX_DECREMENT

`value--`

### POSTFIX_INCREMENT

`value++`

### PREFIX_DECREMENT

`--value`

### PREFIX_INCREMENT

`++value`

## Binary expressions :  `<EXPRESSION>` & `<BINARY_EXPRESSION>`

Container for binary expressions composed of a left and a right hand side where `kind` specifies one of the following binary operations.

* **binaryLeft()**: `<EXPRESSION>`
* **binaryRight()**: `<EXPRESSION>`

### ADD

`left + right`

### ASSIGN

`left = right`

### BITWISE_AND

`left & right`

### BITWISE_OR

`left | right`

### BITWISE_XOR

`left ^ right`

### DIVIDE

`left / right`

### EQUAL

`left == right`

### EXPONENT

`left ** right`

### GREATER_THAN

`left > right`

### GREATER_THAN_EQUAL

`left >= right`

### LESS_THAN

`left < right`

### LESS_THAN_EQUAL

`left <= right`

### LOGICAL_AND

`left && right`

### LOGICAL_OR

`left || right`

### MULTIPLY

`left * right`

### NOT_EQUAL

`left != right`

### REMAINDER

`left % right`

### SHIFT_LEFT

`left << right`

### SHIFT_RIGHT

`left >> right`

### SUBTRACT

`left - right`
