eq(X, X).

mem(X, [X|_]).
mem(X, [_|T]) :- mem(X, T).

right(X, Y, [X, Y|_]).
right(X, Y, [_|T]) :- right(X, Y, T).

puzzle(Who) :-
    eq(Hs, [h(norwegian, _, _), h(_, _, _), h(_, _, _)]),
    mem(h(brit, red, _), Hs),
    mem(h(spaniard, _, dog), Hs),
    right(h(_, red, _), h(_, green, _), Hs),
    mem(h(_, blue, cat), Hs),
    mem(h(Who, _, fish), Hs).

main :-
    findall(Who, puzzle(Who), Ws),
    forall(member(W, Ws), format('{"who":"~w"}~n', [W])).
