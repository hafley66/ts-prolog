// stock predicates; spread into a program: [...Prelude, ...yourClauses]
export type Prelude = [
  "not(G) :- G, !, fail",
  "not(G0)",
  "once(G) :- G, !",
  "member(X, [X|T])",
  "member(X, [H|T]) :- member(X, T)",
  "append([], Y, Y)",
  "append([H|T], Y, [H|R]) :- append(T, Y, R)",
  "select(X, [X|T], T)",
  "select(X, [H|T], [H|R]) :- select(X, T, R)",
  "length([], 0)",
  "length([H|T], N) :- length(T, M), plus(M, 1, N)",
];
