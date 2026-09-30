/**
 * Safe arithmetic expression evaluator for fee formulas.
 *
 * Supports `+`, `-`, `*` operators and field references in `{fieldId}` syntax.
 * No `eval()` — parses into tokens, substitutes values, and evaluates
 * using a simple recursive-descent parser respecting operator precedence.
 *
 * Grammar:
 *   expression := term (('+' | '-') term)*
 *   term       := factor ('*' factor)*
 *   factor     := NUMBER | '(' expression ')'
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExpressionResult {
  status: 'ok' | 'error';
  value?: number;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Tokeniser
// ---------------------------------------------------------------------------

type TokenType = 'NUMBER' | 'PLUS' | 'MINUS' | 'STAR' | 'LPAREN' | 'RPAREN' | 'EOF';

interface Token {
  type: TokenType;
  value: number | null;
}

function tokenise(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Skip whitespace
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }

    if (ch === '+') {
      tokens.push({ type: 'PLUS', value: null });
      i++;
    } else if (ch === '-') {
      tokens.push({ type: 'MINUS', value: null });
      i++;
    } else if (ch === '*') {
      tokens.push({ type: 'STAR', value: null });
      i++;
    } else if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: null });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: null });
      i++;
    } else if (ch >= '0' && ch <= '9' || ch === '.') {
      // Parse number
      let numStr = '';
      while (i < input.length && ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')) {
        numStr += input[i];
        i++;
      }
      const num = parseFloat(numStr);
      if (isNaN(num)) {
        return []; // Will be caught as parse error
      }
      tokens.push({ type: 'NUMBER', value: num });
    } else {
      // Unknown character — error
      return [];
    }
  }

  tokens.push({ type: 'EOF', value: null });
  return tokens;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class Parser {
  private pos = 0;

  constructor(private tokens: Token[]) {}

  private current(): Token {
    return this.tokens[this.pos] ?? { type: 'EOF', value: null };
  }

  private eat(type: TokenType): Token {
    const tok = this.current();
    if (tok.type !== type) {
      throw new Error(`Expected ${type} but got ${tok.type}`);
    }
    this.pos++;
    return tok;
  }

  /** expression := term (('+' | '-') term)* */
  parseExpression(): number {
    let result = this.parseTerm();

    while (this.current().type === 'PLUS' || this.current().type === 'MINUS') {
      const op = this.current().type;
      this.pos++;
      const right = this.parseTerm();
      if (op === 'PLUS') {
        result += right;
      } else {
        result -= right;
      }
    }

    return result;
  }

  /** term := factor ('*' factor)* */
  private parseTerm(): number {
    let result = this.parseFactor();

    while (this.current().type === 'STAR') {
      this.pos++;
      const right = this.parseFactor();
      result *= right;
    }

    return result;
  }

  /** factor := NUMBER | unary_minus factor | '(' expression ')' */
  private parseFactor(): number {
    const tok = this.current();

    if (tok.type === 'NUMBER') {
      this.pos++;
      return tok.value!;
    }

    if (tok.type === 'MINUS') {
      this.pos++;
      return -this.parseFactor();
    }

    if (tok.type === 'LPAREN') {
      this.eat('LPAREN');
      const result = this.parseExpression();
      this.eat('RPAREN');
      return result;
    }

    throw new Error(`Unexpected token: ${tok.type}`);
  }

  /** Ensure all tokens were consumed. */
  ensureComplete(): void {
    if (this.current().type !== 'EOF') {
      throw new Error(`Unexpected token after expression: ${this.current().type}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Substitute `{fieldId}` placeholders in an expression string with numeric
 * values from the provided map, then safely evaluate the arithmetic.
 *
 * @param expression  e.g. `"{base} + {tax} * 2"`
 * @param fieldValues Map of field ID → numeric value
 * @param fieldRefs   List of field IDs referenced in the expression
 * @returns ExpressionResult with the computed value or an error
 */
export function evaluateExpression(
  expression: string,
  fieldValues: Record<string, number>,
  fieldRefs: string[],
): ExpressionResult {
  // Substitute field references
  let substituted = expression;
  for (const ref of fieldRefs) {
    const val = fieldValues[ref];
    if (val === undefined || val === null) {
      return { status: 'error', errorMessage: `Missing field value for "${ref}"` };
    }
    if (typeof val !== 'number' || isNaN(val)) {
      return { status: 'error', errorMessage: `Non-numeric value for field "${ref}"` };
    }
    // Replace all occurrences of {ref}
    const placeholder = `{${ref}}`;
    while (substituted.includes(placeholder)) {
      substituted = substituted.replace(placeholder, String(val));
    }
  }

  // Check for any remaining unsubstituted placeholders
  if (/\{[^}]+\}/.test(substituted)) {
    return { status: 'error', errorMessage: 'Expression contains unresolved field references' };
  }

  // Tokenise
  const tokens = tokenise(substituted);
  if (tokens.length === 0) {
    return { status: 'error', errorMessage: 'Failed to parse expression' };
  }

  // Parse and evaluate
  try {
    const parser = new Parser(tokens);
    const result = parser.parseExpression();
    parser.ensureComplete();

    if (!isFinite(result)) {
      return { status: 'error', errorMessage: 'Expression produced a non-finite result' };
    }

    return { status: 'ok', value: result };
  } catch (err) {
    return {
      status: 'error',
      errorMessage: `Expression evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
