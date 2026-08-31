right(X, Y, [X, Y|_]).
right(X, Y, [_|T]) :- right(X, Y, T).

next(X, Y, L) :- right(X, Y, L).
next(X, Y, L) :- right(Y, X, L).

mem(X, [X|_]).
mem(X, [_|T]) :- mem(X, T).

zebra(Who) :-
    Hs = [h(norwegian, _, _, _, _), _, h(_, _, milk, _, _), _, _],
    mem(h(brit, red, _, _, _), Hs),
    mem(h(swede, _, _, _, dog), Hs),
    mem(h(dane, _, tea, _, _), Hs),
    right(h(_, green, _, _, _), h(_, white, _, _, _), Hs),
    mem(h(_, green, coffee, _, _), Hs),
    mem(h(_, _, _, pallmall, bird), Hs),
    mem(h(_, yellow, _, dunhill, _), Hs),
    next(h(_, _, _, _, horse), h(_, yellow, _, dunhill, _), Hs),
    mem(h(_, _, beer, bluemaster, _), Hs),
    mem(h(german, _, _, prince, _), Hs),
    next(h(norwegian, _, _, _, _), h(_, blue, _, _, _), Hs),
    next(h(_, _, _, blend, _), h(_, _, _, _, cat), Hs),
    next(h(_, _, _, blend, _), h(_, _, water, _, _), Hs),
    mem(h(Who, _, _, _, fish), Hs).

main :-
    findall(W, zebra(W), Rs),
    forall(member(W, Rs), format('{"who":"~w"}~n', [W])).
