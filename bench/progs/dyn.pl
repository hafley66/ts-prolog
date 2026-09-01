:- dynamic saw/1.

mem2(X, [X|_]).
mem2(X, [_|T]) :- mem2(X, T).

mark :- mem2(X, [a, b, c]), assertz(saw(X)), fail.
mark.

dyn(L) :- mark, findall(X, saw(X), L).

jlist(L, S) :-
    maplist([X, Q]>>format(atom(Q), '"~w"', [X]), L, Qs),
    atomic_list_concat(Qs, ',', Inner),
    format(atom(S), '[~w]', [Inner]).

main :-
    findall(L, dyn(L), Rs),
    forall(member(L, Rs), (jlist(L, J), format('{"l":~w}~n', [J]))).
