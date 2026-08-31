sel(X, [X|T], T).
sel(X, [H|T], [H|R]) :- sel(X, T, R).

perm([], []).
perm(L, [X|P]) :- sel(X, L, R), perm(R, P).

jlist(L, S) :-
    maplist([X, Q]>>format(atom(Q), '"~w"', [X]), L, Qs),
    atomic_list_concat(Qs, ',', Inner),
    format(atom(S), '[~w]', [Inner]).

main :-
    findall(P, perm([a, b, c, d], P), Ps),
    forall(member(P, Ps), (jlist(P, J), format('{"p":~w}~n', [J]))).
